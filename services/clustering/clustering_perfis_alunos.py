#!/usr/bin/env python3
"""
Clustering de perfis de alunos (Vitru / EAD).

Segmenta a base de alunos em perfis comportamentais a partir de variaveis de
engajamento (acesso ao AVA, entrega de atividades, desempenho, financeiro) e
descreve cada perfil, cruzando com a evasao observada (FL_EVADIU_OU_INTENCIONOU)
e com a probabilidade predita pelo modelo (Y_PROBA_EVADIU).

As colunas de alvo/predicao NAO entram no clustering - sao usadas apenas para
caracterizar os grupos depois (evita vazamento e mantem os perfis acionaveis).

Uso:
    python clustering_perfis_alunos.py
    python clustering_perfis_alunos.py --k 6
    python clustering_perfis_alunos.py --k-min 3 --k-max 12 --tp-aluno CALOURO
    python clustering_perfis_alunos.py --amostra 100000 --saida resultados/

Sem --k, o script testa de --k-min a --k-max e escolhe o maior k cuja silhouette
fique dentro de --tolerancia-k do melhor valor (a curva e plana nessa base).

Para rotular uma base nova com os perfis ja definidos (sem retreinar):

    python clustering_perfis_alunos.py --arquivo nova_base.xlsx \
        --modelo saida_clusters/modelo_clusters.joblib --saida saida_nova/

Ou, em outro codigo:

    import joblib, pandas as pd
    art = joblib.load("saida_clusters/modelo_clusters.joblib")
    Z = art["preprocessador"].transform(df[art["features"]])
    df["cluster"] = art["kmeans"].predict(Z)
    df["nm_perfil"] = df["cluster"].map(art["perfis"])

Saidas (diretorio --saida, padrao "saida_clusters/"):
    modelo_clusters.joblib    preprocessador + centroides, para rotular alunos novos
    centroides.csv            centroides em unidade original e transformada
    alunos_clusters.csv       ID_ALUNO + cluster + nome do perfil
    perfis_resumo.csv         media de cada variavel por cluster
    perfis_zscore.csv         desvio de cada cluster em relacao a media geral
    selecao_k.csv             silhouette / inercia por k testado
    relatorio_perfis.md       leitura em texto de cada perfil
    fig_selecao_k.png         curva de cotovelo + silhouette
    fig_heatmap_perfis.png    heatmap dos z-scores por perfil
    fig_pca_clusters.png      dispersao PCA 2D dos clusters
    fig_evasao_por_perfil.png taxa de evasao por perfil
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import sklearn
from sklearn.cluster import MiniBatchKMeans
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.metrics import calinski_harabasz_score, silhouette_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import QuantileTransformer

# --------------------------------------------------------------------------- #
# Configuracao
# --------------------------------------------------------------------------- #

ARQUIVO_PADRAO = "dataset_aluno_predicted_20260807_hac.xlsx"
ABA_PADRAO = "data"
CACHE_PARQUET = ".cache_dataset_aluno.parquet"

COL_ID = "ID_ALUNO"

# Variaveis comportamentais usadas para formar os perfis.
FEATURES = [
    "QT_IDADE_ALUNO",
    "FL_ENTRADA_TARDIA",
    "FL_ALUNO_SEM_ESPACO_CALOURO",
    "FL_FEZ_QUEST_ESPACO_CALOURO",
    "FL_FEZ_QUEST_CONHECA_EAD",
    "FL_ACESSOU_CONHECA_EAD",
    "QT_DIA_ATE_PRI_ACESSO",
    "QT_DIA_ACESSO_TOTAL",
    "QT_ACESSO_AVA_SEMANA_ENTREGA_ATV",
    "PC_ATIVIDADE_ENTREGUE",
    "QT_ATV_ENTREGUE",
    "PC_AULA_AOVIVO_ASSISTIDA",
    "PC_AULA_CONCEITUAL_ASSISTIDA",
    "PC_ENGAJAMENTO_FINANCEIRO",
    "PC_RENEGOCIACAO",
    "PC_CONCLUSAO_CURSO",
    "PC_DESEMP_MF",
    "PC_DESEMP_ATIV",
    "PC_DESEMP_PROVA",
    "PC_DISC_APROV",
]

# Nunca entram no clustering: alvo, predicao do modelo e identificadores.
COLS_ALVO = [
    "FL_EVADIU",
    "FL_INTENCIONOU_CANCELAMENTO",
    "FL_EVADIU_OU_INTENCIONOU",
    "Y_PRED",
    "Y_PROBA_EVADIU",
    "Y_PROBA_NAO_EVADIU",
    "NM_CLUSTER_PROBA",
]

COL_EVASAO = "FL_EVADIU_OU_INTENCIONOU"
COL_PROBA = "Y_PROBA_EVADIU"

# Rotulos legiveis para o relatorio.
ROTULOS = {
    "QT_IDADE_ALUNO": "Idade no ingresso",
    "FL_ENTRADA_TARDIA": "Entrada tardia",
    "FL_ALUNO_SEM_ESPACO_CALOURO": "Sem Espaco Calouro",
    "FL_FEZ_QUEST_ESPACO_CALOURO": "Respondeu quest. Espaco Calouro",
    "FL_FEZ_QUEST_CONHECA_EAD": "Respondeu quest. Conheca EAD",
    "FL_ACESSOU_CONHECA_EAD": "Acessou Conheca EAD",
    "QT_DIA_ATE_PRI_ACESSO": "Dias ate o 1o acesso",
    "QT_DIA_ACESSO_TOTAL": "Dias totais de acesso ao AVA",
    "QT_ACESSO_AVA_SEMANA_ENTREGA_ATV": "Acessos ao AVA na semana de atividades",
    "PC_ATIVIDADE_ENTREGUE": "% atividades entregues",
    "QT_ATV_ENTREGUE": "Qtde de atividades entregues",
    "PC_AULA_AOVIVO_ASSISTIDA": "% aulas ao vivo assistidas",
    "PC_AULA_CONCEITUAL_ASSISTIDA": "% aulas conceituais assistidas",
    "PC_ENGAJAMENTO_FINANCEIRO": "% engajamento financeiro",
    "PC_RENEGOCIACAO": "% renegociacao",
    "PC_CONCLUSAO_CURSO": "% de conclusao do curso",
    "PC_DESEMP_MF": "Desempenho - media final",
    "PC_DESEMP_ATIV": "Desempenho - atividades",
    "PC_DESEMP_PROVA": "Desempenho - provas",
    "PC_DISC_APROV": "% disciplinas aprovadas",
}

# Variaveis em que valor ALTO e sinal RUIM (usado so para nomear os perfis).
INVERSAS = {"QT_DIA_ATE_PRI_ACESSO", "FL_ENTRADA_TARDIA", "FL_ALUNO_SEM_ESPACO_CALOURO", "PC_RENEGOCIACAO"}

RANDOM_STATE = 42


# --------------------------------------------------------------------------- #
# Carga de dados
# --------------------------------------------------------------------------- #


def carregar_dados(caminho: Path, aba: str, usar_cache: bool = True) -> pd.DataFrame:
    """Le a planilha. Como o .xlsx e grande (~90 MB / 457k linhas), guarda um
    cache em parquet e reutiliza nas execucoes seguintes."""
    cache = caminho.with_name(CACHE_PARQUET)

    if usar_cache and cache.exists() and cache.stat().st_mtime >= caminho.stat().st_mtime:
        print(f"[dados] lendo cache {cache.name}")
        return pd.read_parquet(cache)

    print(f"[dados] lendo {caminho.name} (pode levar alguns minutos)...")
    t0 = time.time()
    df = pd.read_excel(caminho, sheet_name=aba, engine="openpyxl")
    print(f"[dados] {len(df):,} linhas x {df.shape[1]} colunas em {time.time() - t0:.0f}s")

    if usar_cache:
        try:
            df.to_parquet(cache, index=False)
            print(f"[dados] cache salvo em {cache.name}")
        except Exception as exc:  # pyarrow ausente, disco cheio etc.
            print(f"[dados] aviso: nao foi possivel salvar cache ({exc})")

    return df


def preparar_matriz(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Seleciona as features disponiveis e converte tudo para numerico."""
    features = [c for c in FEATURES if c in df.columns]
    faltando = sorted(set(FEATURES) - set(features))
    if faltando:
        print(f"[features] ausentes na planilha, ignoradas: {', '.join(faltando)}")
    if len(features) < 3:
        sys.exit("[erro] menos de 3 features disponiveis - verifique o arquivo de entrada.")

    X = df[features].apply(pd.to_numeric, errors="coerce")

    # Descarta colunas constantes (nao separam ninguem) e avisa.
    constantes = [c for c in X.columns if X[c].nunique(dropna=True) <= 1]
    if constantes:
        print(f"[features] constantes, removidas: {', '.join(constantes)}")
        X = X.drop(columns=constantes)
        features = [c for c in features if c not in constantes]

    nulos = X.isna().mean()
    if (nulos > 0).any():
        top = nulos[nulos > 0].sort_values(ascending=False).head(5)
        print("[features] nulos (imputados pela mediana): "
              + ", ".join(f"{c} {v:.1%}" for c, v in top.items()))

    print(f"[features] {len(features)} variaveis no clustering")
    return X, features


# --------------------------------------------------------------------------- #
# Clustering
# --------------------------------------------------------------------------- #


def construir_preprocessador() -> Pipeline:
    """Mediana + QuantileTransformer.

    As variaveis tem escalas e caudas muito diferentes (dias, contagens, %).
    A transformacao para distribuicao normal por quantis deixa todas na mesma
    escala e reduz o peso de outliers - k-means e sensivel aos dois problemas.
    """
    return Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            (
                "scaler",
                QuantileTransformer(
                    output_distribution="normal",
                    n_quantiles=1000,
                    subsample=200_000,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )


def _kmeans(k: int) -> MiniBatchKMeans:
    return MiniBatchKMeans(
        n_clusters=k,
        random_state=RANDOM_STATE,
        n_init=10,
        batch_size=4096,
        max_iter=300,
        max_no_improvement=30,
    )


def salvar_modelo(
    caminho: Path,
    pre: Pipeline,
    modelo: MiniBatchKMeans,
    features: list[str],
    nomes: dict[int, str],
    silhouette: float,
) -> None:
    """Persiste preprocessador + k-means num unico artefato.

    Os centroides sozinhos nao bastam: eles vivem no espaco transformado pelo
    QuantileTransformer, entao o scaler ajustado precisa vir junto - sem ele,
    dados novos cairiam numa escala diferente da do treino.
    """
    joblib.dump(
        {
            "preprocessador": pre,
            "kmeans": modelo,
            "features": features,
            "perfis": nomes,
            "silhouette": silhouette,
            "random_state": RANDOM_STATE,
            "versao_sklearn": sklearn.__version__,
            "criado_em": pd.Timestamp.now().isoformat(timespec="seconds"),
        },
        caminho,
        compress=3,
    )
    print(f"[saida] {caminho}")


def carregar_modelo(caminho: Path) -> tuple[Pipeline, MiniBatchKMeans, list[str], dict[int, str]]:
    """Le o artefato salvo por salvar_modelo()."""
    if not caminho.exists():
        sys.exit(f"[erro] modelo nao encontrado: {caminho}")

    artefato = joblib.load(caminho)
    versao = artefato.get("versao_sklearn")
    if versao and versao != sklearn.__version__:
        print(f"[modelo] aviso: treinado com scikit-learn {versao}, rodando {sklearn.__version__}")

    nomes = {int(c): n for c, n in artefato["perfis"].items()}
    return artefato["preprocessador"], artefato["kmeans"], artefato["features"], nomes


def salvar_centroides(
    caminho: Path,
    pre: Pipeline,
    modelo: MiniBatchKMeans,
    features: list[str],
    nomes: dict[int, str],
) -> None:
    """Salva os centroides em CSV, nas duas escalas.

    A versao transformada e a que o k-means usa (util para reimplementar o
    predict em outra stack); a versao em unidades originais - dias, %, contagens
    - e a que se le como "o aluno tipico deste perfil".
    """
    centros_z = pd.DataFrame(modelo.cluster_centers_, columns=features)
    centros_z.index.name = "cluster"

    scaler = pre.named_steps["scaler"]
    centros_orig = pd.DataFrame(scaler.inverse_transform(modelo.cluster_centers_), columns=features)
    centros_orig.index.name = "cluster"

    saida = pd.concat(
        {"unidade_original": centros_orig.round(2), "escala_transformada": centros_z.round(4)},
        axis=1,
    )
    saida.insert(0, "nm_perfil", [nomes[int(c)] for c in saida.index])
    saida.to_csv(caminho)
    print(f"[saida] {caminho}")


def escolher_k(Z: np.ndarray, k_min: int, k_max: int, n_sil: int = 20_000) -> pd.DataFrame:
    """Roda k-means para cada k e mede inercia, silhouette e Calinski-Harabasz.

    A silhouette e calculada numa amostra (custo O(n^2) na base inteira).
    """
    rng = np.random.default_rng(RANDOM_STATE)
    idx = rng.choice(len(Z), size=min(n_sil, len(Z)), replace=False)
    Z_sil = Z[idx]

    linhas = []
    for k in range(k_min, k_max + 1):
        modelo = _kmeans(k).fit(Z)
        rotulos_sil = modelo.predict(Z_sil)
        sil = silhouette_score(Z_sil, rotulos_sil) if len(np.unique(rotulos_sil)) > 1 else np.nan
        ch = calinski_harabasz_score(Z_sil, rotulos_sil) if len(np.unique(rotulos_sil)) > 1 else np.nan
        linhas.append({"k": k, "inercia": modelo.inertia_, "silhouette": sil, "calinski_harabasz": ch})
        print(f"[k={k}] inercia={modelo.inertia_:,.0f}  silhouette={sil:.4f}  CH={ch:,.0f}")

    return pd.DataFrame(linhas)


def melhor_k(tabela: pd.DataFrame, tolerancia: float = 0.05) -> int:
    """Escolhe k pela silhouette, mas preferindo o maior k dentro da tolerancia.

    Em base de comportamento a curva de silhouette costuma ser bem plana (aqui,
    k=3 e k=7 empatam na terceira casa). Ficar com o k minimo nesse caso junta
    perfis operacionalmente diferentes; entao, entre valores estatisticamente
    equivalentes, fica o mais granular - que gera acoes mais especificas.
    """
    topo = tabela["silhouette"].max()
    candidatos = tabela[tabela["silhouette"] >= topo * (1 - tolerancia)]
    return int(candidatos["k"].max())


# --------------------------------------------------------------------------- #
# Perfilamento
# --------------------------------------------------------------------------- #


def resumir_clusters(df: pd.DataFrame, X: pd.DataFrame, rotulos: np.ndarray) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Media de cada variavel por cluster e o mesmo em z-score global."""
    base = X.copy()
    base["cluster"] = rotulos

    resumo = base.groupby("cluster").mean(numeric_only=True)
    resumo.insert(0, "qt_alunos", base.groupby("cluster").size())
    resumo.insert(1, "pc_base", 100 * resumo["qt_alunos"] / len(base))

    # Cruzamentos descritivos (nao usados para formar os grupos).
    for col in (COL_EVASAO, COL_PROBA, "FL_EVADIU", "FL_INTENCIONOU_CANCELAMENTO"):
        if col in df.columns:
            valores = pd.to_numeric(df[col], errors="coerce").groupby(rotulos).mean()
            resumo.insert(2, f"media_{col}", valores)

    if "TP_ALUNO" in df.columns:
        moda = df["TP_ALUNO"].groupby(rotulos).agg(lambda s: s.mode().iat[0] if not s.mode().empty else "NA")
        resumo.insert(2, "TP_ALUNO_predominante", moda)

    mu, sigma = X.mean(), X.std().replace(0, np.nan)
    z = (resumo[X.columns] - mu) / sigma

    return resumo, z


def nomear_perfis(resumo: pd.DataFrame, z: pd.DataFrame) -> dict[int, str]:
    """Gera um nome curto por cluster: nivel de engajamento + traco dominante."""
    # Score de engajamento: media dos z-scores, invertendo o sinal das variaveis
    # em que "mais" significa "pior".
    sinal = pd.Series({c: (-1 if c in INVERSAS else 1) for c in z.columns})
    engajamento = (z * sinal).mean(axis=1)

    faixas = pd.Series(index=z.index, dtype=object)
    for cluster, valor in engajamento.items():
        if valor >= 0.45:
            faixas[cluster] = "Engajado"
        elif valor >= 0.12:
            faixas[cluster] = "Regular"
        elif valor >= -0.25:
            faixas[cluster] = "Intermitente"
        else:
            faixas[cluster] = "Desengajado"

    nomes = {}
    for cluster in z.index:
        traco = z.loc[cluster].abs().idxmax()
        direcao = "alto" if z.loc[cluster, traco] > 0 else "baixo"
        rotulo = ROTULOS.get(traco, traco)
        nomes[int(cluster)] = f"C{cluster} - {faixas[cluster]} ({rotulo} {direcao})"

    return nomes


def escrever_relatorio(
    caminho: Path,
    resumo: pd.DataFrame,
    z: pd.DataFrame,
    nomes: dict[int, str],
    k: int,
    n_total: int,
    metricas: dict,
) -> None:
    l = []
    l.append("# Perfis de alunos - clustering k-means\n")
    l.append(f"- Alunos analisados: **{n_total:,}**")
    l.append(f"- Numero de perfis (k): **{k}**")
    l.append(f"- Silhouette (amostra): **{metricas.get('silhouette', float('nan')):.4f}**")
    l.append(f"- Variaveis usadas: {len(z.columns)}\n")

    if f"media_{COL_EVASAO}" in resumo.columns:
        media_geral = 100 * float(resumo[f"media_{COL_EVASAO}"].mul(resumo["qt_alunos"]).sum() / resumo["qt_alunos"].sum())
        l.append(f"Taxa media de evasao/intencao na base: **{media_geral:.1f}%**\n")

    l.append("## Visao geral\n")
    cabecalho = ["Perfil", "Alunos", "% base"]
    if f"media_{COL_EVASAO}" in resumo.columns:
        cabecalho.append("% evasao/intencao")
    if f"media_{COL_PROBA}" in resumo.columns:
        cabecalho.append("Proba media do modelo")
    l.append("| " + " | ".join(cabecalho) + " |")
    l.append("|" + "---|" * len(cabecalho))
    for cluster in resumo.index:
        linha = [nomes[int(cluster)], f"{int(resumo.loc[cluster, 'qt_alunos']):,}", f"{resumo.loc[cluster, 'pc_base']:.1f}%"]
        if f"media_{COL_EVASAO}" in resumo.columns:
            linha.append(f"{100 * resumo.loc[cluster, f'media_{COL_EVASAO}']:.1f}%")
        if f"media_{COL_PROBA}" in resumo.columns:
            linha.append(f"{resumo.loc[cluster, f'media_{COL_PROBA}']:.1f}")
        l.append("| " + " | ".join(linha) + " |")
    l.append("")

    l.append("## Detalhe por perfil\n")
    for cluster in resumo.index:
        l.append(f"### {nomes[int(cluster)]}\n")
        l.append(f"{int(resumo.loc[cluster, 'qt_alunos']):,} alunos ({resumo.loc[cluster, 'pc_base']:.1f}% da base)")
        if f"media_{COL_EVASAO}" in resumo.columns:
            l.append(f"- Evasao/intencao observada: {100 * resumo.loc[cluster, f'media_{COL_EVASAO}']:.1f}%")
        if f"media_{COL_PROBA}" in resumo.columns:
            l.append(f"- Probabilidade media de evasao (modelo): {resumo.loc[cluster, f'media_{COL_PROBA}']:.1f}")
        if "TP_ALUNO_predominante" in resumo.columns:
            l.append(f"- Tipo de aluno predominante: {resumo.loc[cluster, 'TP_ALUNO_predominante']}")

        destaques = z.loc[cluster].reindex(z.loc[cluster].abs().sort_values(ascending=False).index).head(6)
        l.append("\nO que distingue este perfil (desvio vs. media da base):\n")
        for var, valor in destaques.items():
            direcao = "acima" if valor > 0 else "abaixo"
            l.append(
                f"- **{ROTULOS.get(var, var)}**: {valor:+.2f} desvios ({direcao} da media) "
                f"| media do grupo = {resumo.loc[cluster, var]:.1f} vs. base = {resumo[var].mul(resumo['qt_alunos']).sum() / resumo['qt_alunos'].sum():.1f}"
            )
        l.append("")

    caminho.write_text("\n".join(l), encoding="utf-8")
    print(f"[saida] {caminho}")


# --------------------------------------------------------------------------- #
# Graficos
# --------------------------------------------------------------------------- #


def plot_selecao_k(tabela: pd.DataFrame, caminho: Path) -> None:
    fig, ax1 = plt.subplots(figsize=(8, 4.5))
    ax1.plot(tabela["k"], tabela["inercia"], "o-", color="#4C6EF5", label="Inercia")
    ax1.set_xlabel("k (numero de perfis)")
    ax1.set_ylabel("Inercia", color="#4C6EF5")
    ax1.tick_params(axis="y", labelcolor="#4C6EF5")

    ax2 = ax1.twinx()
    ax2.plot(tabela["k"], tabela["silhouette"], "s--", color="#E8590C", label="Silhouette")
    ax2.set_ylabel("Silhouette", color="#E8590C")
    ax2.tick_params(axis="y", labelcolor="#E8590C")

    ax1.set_title("Escolha de k: cotovelo x silhouette")
    fig.tight_layout()
    fig.savefig(caminho, dpi=140)
    plt.close(fig)
    print(f"[saida] {caminho}")


def plot_heatmap(z: pd.DataFrame, nomes: dict[int, str], caminho: Path) -> None:
    dados = z.T
    fig, ax = plt.subplots(figsize=(1.6 * len(dados.columns) + 5, 0.34 * len(dados) + 2.5))
    lim = float(np.nanmax(np.abs(dados.values))) or 1.0
    im = ax.imshow(dados.values, cmap="RdBu_r", vmin=-lim, vmax=lim, aspect="auto")

    ax.set_xticks(range(len(dados.columns)))
    ax.set_xticklabels([nomes[int(c)].split(" - ")[0] + "\n" + nomes[int(c)].split(" - ")[1][:22] for c in dados.columns],
                       fontsize=8)
    ax.set_yticks(range(len(dados.index)))
    ax.set_yticklabels([ROTULOS.get(v, v) for v in dados.index], fontsize=8)

    for i in range(dados.shape[0]):
        for j in range(dados.shape[1]):
            valor = dados.values[i, j]
            if np.isfinite(valor):
                ax.text(j, i, f"{valor:+.1f}", ha="center", va="center", fontsize=7,
                        color="white" if abs(valor) > 0.6 * lim else "black")

    ax.set_title("Perfil de cada cluster (z-score vs. media da base)")
    fig.colorbar(im, ax=ax, shrink=0.7, label="desvios-padrao")
    fig.tight_layout()
    fig.savefig(caminho, dpi=140)
    plt.close(fig)
    print(f"[saida] {caminho}")


def plot_pca(Z: np.ndarray, rotulos: np.ndarray, nomes: dict[int, str], caminho: Path, n_max: int = 30_000) -> None:
    rng = np.random.default_rng(RANDOM_STATE)
    idx = rng.choice(len(Z), size=min(n_max, len(Z)), replace=False)
    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    P = pca.fit_transform(Z[idx])

    fig, ax = plt.subplots(figsize=(8, 6.5))
    cores = plt.cm.tab10(np.linspace(0, 1, 10))
    for c in sorted(np.unique(rotulos)):
        m = rotulos[idx] == c
        ax.scatter(P[m, 0], P[m, 1], s=4, alpha=0.35, color=cores[c % 10], label=nomes[int(c)])
    ax.set_xlabel(f"PC1 ({100 * pca.explained_variance_ratio_[0]:.1f}% da variancia)")
    ax.set_ylabel(f"PC2 ({100 * pca.explained_variance_ratio_[1]:.1f}% da variancia)")
    ax.set_title("Perfis de alunos projetados em 2 componentes principais")
    ax.legend(markerscale=4, fontsize=7, loc="best")
    fig.tight_layout()
    fig.savefig(caminho, dpi=140)
    plt.close(fig)
    print(f"[saida] {caminho}")


def plot_evasao(resumo: pd.DataFrame, nomes: dict[int, str], caminho: Path) -> None:
    col = f"media_{COL_EVASAO}"
    if col not in resumo.columns:
        return
    ordem = resumo.sort_values(col, ascending=False)
    valores = 100 * ordem[col]
    media = float(100 * resumo[col].mul(resumo["qt_alunos"]).sum() / resumo["qt_alunos"].sum())

    fig, ax = plt.subplots(figsize=(9, 0.6 * len(ordem) + 2.5))
    barras = ax.barh([nomes[int(c)] for c in ordem.index], valores, color="#C92A2A", alpha=0.85)
    ax.axvline(media, color="#495057", ls="--", lw=1, label=f"media da base ({media:.1f}%)")
    ax.bar_label(barras, fmt="%.1f%%", padding=3, fontsize=8)
    ax.invert_yaxis()
    ax.set_xlabel("% de evasao ou intencao de cancelamento")
    ax.set_title("Risco observado por perfil")
    ax.legend(fontsize=8)
    ax.tick_params(axis="y", labelsize=8)
    fig.tight_layout()
    fig.savefig(caminho, dpi=140)
    plt.close(fig)
    print(f"[saida] {caminho}")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #


def main() -> None:
    p = argparse.ArgumentParser(description="Clustering de perfis de alunos")
    p.add_argument("--arquivo", default=ARQUIVO_PADRAO, help="planilha .xlsx de entrada")
    p.add_argument("--aba", default=ABA_PADRAO, help="nome da aba")
    p.add_argument("--saida", default="saida_clusters", help="diretorio de saida")
    p.add_argument("--k", type=int, default=None, help="fixa o numero de perfis (pula a busca)")
    p.add_argument("--k-min", type=int, default=3)
    p.add_argument("--k-max", type=int, default=8)
    p.add_argument("--tolerancia-k", type=float, default=0.05,
                   help="margem de silhouette para preferir k maior (padrao 5%%)")
    p.add_argument("--amostra", type=int, default=None, help="usa apenas N alunos (teste rapido)")
    p.add_argument("--tp-aluno", default=None, help="filtra por TP_ALUNO (ex.: CALOURO)")
    p.add_argument("--modelo", default=None,
                   help="aplica um modelo ja treinado (modelo_clusters.joblib) em vez de treinar")
    p.add_argument("--sem-cache", action="store_true", help="ignora o cache parquet")
    args = p.parse_args()

    entrada = Path(args.arquivo).expanduser().resolve()
    if not entrada.exists():
        sys.exit(f"[erro] arquivo nao encontrado: {entrada}")

    saida = Path(args.saida).expanduser().resolve()
    saida.mkdir(parents=True, exist_ok=True)

    df = carregar_dados(entrada, args.aba, usar_cache=not args.sem_cache)

    if args.tp_aluno:
        antes = len(df)
        df = df[df["TP_ALUNO"].astype(str).str.upper() == args.tp_aluno.upper()]
        print(f"[filtro] TP_ALUNO={args.tp_aluno}: {len(df):,} de {antes:,} alunos")
        if df.empty:
            sys.exit("[erro] filtro nao retornou alunos.")

    if args.amostra and args.amostra < len(df):
        df = df.sample(n=args.amostra, random_state=RANDOM_STATE)
        print(f"[amostra] usando {len(df):,} alunos")

    df = df.reset_index(drop=True)

    X, features = preparar_matriz(df)

    nomes_salvos = None

    if args.modelo:
        # Reaproveita um modelo ja treinado: mesmo preprocessador, mesmos
        # centroides, mesma numeracao de clusters.
        pre, modelo, features, nomes_salvos = carregar_modelo(Path(args.modelo))
        faltando = [c for c in features if c not in X.columns]
        if faltando:
            sys.exit(f"[erro] o modelo exige colunas ausentes nos dados: {', '.join(faltando)}")
        X = X[features]  # mesma ordem usada no treino
        Z = pre.transform(X)
        k = int(modelo.n_clusters)
        tabela_k = pd.DataFrame()
        print(f"[modelo] carregado de {args.modelo} (k={k}, {len(features)} features)")
    else:
        pre = construir_preprocessador()
        Z = pre.fit_transform(X)
        print(f"[preproc] matriz {Z.shape[0]:,} x {Z.shape[1]}")

        if args.k:
            k = args.k
            tabela_k = pd.DataFrame()
            print(f"[k] usando k={k} (fixado por parametro)")
        else:
            tabela_k = escolher_k(Z, args.k_min, args.k_max)
            tabela_k.to_csv(saida / "selecao_k.csv", index=False)
            k = melhor_k(tabela_k, args.tolerancia_k)
            melhor_sil = int(tabela_k.loc[tabela_k["silhouette"].idxmax(), "k"])
            if k != melhor_sil:
                print(f"[k] k={k} escolhido (silhouette dentro de {args.tolerancia_k:.0%} do topo em k={melhor_sil}, "
                      "com mais granularidade)")
            else:
                print(f"[k] melhor silhouette em k={k}")
            plot_selecao_k(tabela_k, saida / "fig_selecao_k.png")

        modelo = _kmeans(k).fit(Z)

    rotulos = modelo.predict(Z)

    rng = np.random.default_rng(RANDOM_STATE)
    idx = rng.choice(len(Z), size=min(20_000, len(Z)), replace=False)
    sil = float(silhouette_score(Z[idx], rotulos[idx]))
    print(f"[modelo] k={k} silhouette={sil:.4f}")

    resumo, z = resumir_clusters(df, X, rotulos)
    # Com modelo carregado, mantem os nomes originais: renomear quebraria a
    # comparacao com execucoes anteriores.
    nomes = nomes_salvos if nomes_salvos else nomear_perfis(resumo, z)

    if not args.modelo:
        salvar_modelo(saida / "modelo_clusters.joblib", pre, modelo, features, nomes, sil)
        salvar_centroides(saida / "centroides.csv", pre, modelo, features, nomes)

    saida_alunos = pd.DataFrame({"cluster": rotulos})
    saida_alunos["nm_perfil"] = saida_alunos["cluster"].map(nomes)
    for col in (COL_ID, "TP_ALUNO", "CD_CURSO", "CD_POLO", COL_EVASAO, COL_PROBA):
        if col in df.columns:
            saida_alunos.insert(0, col, df[col].values)

    saida_alunos.to_csv(saida / "alunos_clusters.csv", index=False)
    resumo.round(3).to_csv(saida / "perfis_resumo.csv")
    z.round(3).to_csv(saida / "perfis_zscore.csv")
    print(f"[saida] {saida / 'alunos_clusters.csv'}")
    print(f"[saida] {saida / 'perfis_resumo.csv'}")
    print(f"[saida] {saida / 'perfis_zscore.csv'}")

    escrever_relatorio(saida / "relatorio_perfis.md", resumo, z, nomes, k, len(df), {"silhouette": sil})
    plot_heatmap(z, nomes, saida / "fig_heatmap_perfis.png")
    plot_pca(Z, rotulos, nomes, saida / "fig_pca_clusters.png")
    plot_evasao(resumo, nomes, saida / "fig_evasao_por_perfil.png")

    (saida / "metadados.json").write_text(
        json.dumps(
            {
                "arquivo": str(entrada),
                "n_alunos": int(len(df)),
                "k": k,
                "silhouette": sil,
                "features": features,
                "filtro_tp_aluno": args.tp_aluno,
                "perfis": nomes,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print("\nResumo dos perfis:")
    for cluster in resumo.index:
        linha = f"  {nomes[int(cluster)]}: {int(resumo.loc[cluster, 'qt_alunos']):,} alunos"
        if f"media_{COL_EVASAO}" in resumo.columns:
            linha += f" | evasao {100 * resumo.loc[cluster, f'media_{COL_EVASAO}']:.1f}%"
        print(linha)


if __name__ == "__main__":
    main()
