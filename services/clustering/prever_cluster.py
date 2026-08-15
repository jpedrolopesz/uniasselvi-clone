#!/usr/bin/env python3
"""
Classifica um estudante em um dos perfis (clusters) treinados.

Recebe os dados comportamentais de um aluno no mesmo padrao do
dataset_aluno_predicted_*.xlsx e devolve o cluster, o nome do perfil, a
distancia aos centroides e o que mais afasta o aluno do centro do seu grupo.

O modelo vem de clustering_perfis_alunos.py (modelo_clusters.joblib).

Formas de entrada aceitas:

  1) Array com as 20 features, na ordem do modelo (veja --features):
        python prever_cluster.py 36 0 0 1 0 0 46 14 3 100 6 80 4 100 0 55 10 0 0 0

  2) Array com as 20 features na ordem em que aparecem no xlsx:
        python prever_cluster.py --ordem xlsx 36 0 0 1 0 0 46 14 3 100 6 80 4 100 0 55 10 0 0 0

  3) Linha completa do xlsx (44 colunas) - as features sao extraidas por nome:
        python prever_cluster.py --ordem xlsx-completo CALOURO 1 2026-53 EGRAD_PED 509 ...

  4) JSON por nome de coluna (colunas ausentes viram a mediana do treino):
        python prever_cluster.py --json '{"QT_IDADE_ALUNO": 36, "PC_ATIVIDADE_ENTREGUE": 0}'
        python prever_cluster.py --json aluno.json
        cat aluno.json | python prever_cluster.py --json -

  5) Lote via CSV com as colunas nomeadas:
        python prever_cluster.py --lote alunos.csv --saida-lote resultado.csv

Saida em texto (padrao) ou JSON (--formato json).

Uso como biblioteca:

    from prever_cluster import carregar, prever
    modelo = carregar("saida_clusters/modelo_clusters.joblib")
    print(prever(modelo, [36, 0, 0, 1, 0, 0, 46, 14, 3, 100, 6, 80, 4, 100, 0, 55, 10, 0, 0, 0]))
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

MODELO_PADRAO = "saida_clusters/modelo_clusters.joblib"
RESUMO_PADRAO = "saida_clusters/perfis_resumo.csv"

# Ordem das colunas no xlsx de origem - usada para interpretar uma linha crua.
COLUNAS_XLSX = [
    "TP_ALUNO", "ID_ALUNO", "CD_MODULO_INGRESSO", "CD_CURSO", "CD_POLO",
    "FL_INTENCIONOU_CANCELAMENTO", "FL_EVADIU", "FL_EVADIU_OU_INTENCIONOU",
    "QT_IDADE_ALUNO", "FL_ALUNO_SEM_ESPACO_CALOURO", "FL_ENTRADA_TARDIA",
    "FL_FEZ_QUEST_ESPACO_CALOURO", "FL_FEZ_QUEST_CONHECA_EAD", "FL_ACESSOU_CONHECA_EAD",
    "QT_DIA_ATE_PRI_ACESSO", "QT_DIA_ACESSO_TOTAL", "QT_ACESSO_AVA_SEMANA_ENTREGA_ATV",
    "PC_ATIVIDADE_ENTREGUE", "QT_ATV_ENTREGUE", "PC_AULA_AOVIVO_ASSISTIDA",
    "PC_AULA_CONCEITUAL_ASSISTIDA", "PC_ENGAJAMENTO_FINANCEIRO", "PC_RENEGOCIACAO",
    "PC_CONCLUSAO_CURSO", "PC_DESEMP_MF", "PC_DESEMP_ATIV", "PC_DESEMP_PROVA",
    "PC_DISC_APROV", "Y_PRED", "Y_PROBA_EVADIU", "Y_PROBA_NAO_EVADIU",
    "NM_CLUSTER_PROBA", "CD_MOTIVO_DETRATOR_1", "DS_MOTIVO_DETRATOR_1",
    "CD_MOTIVO_DETRATOR_2", "DS_MOTIVO_DETRATOR_2", "CD_MOTIVO_DETRATOR_3",
    "DS_MOTIVO_DETRATOR_3", "CD_MOTIVO_PROMOTOR_1", "DS_MOTIVO_PROMOTOR_1",
    "CD_MOTIVO_PROMOTOR_2", "DS_MOTIVO_PROMOTOR_2", "CD_MOTIVO_PROMOTOR_3",
    "DS_MOTIVO_PROMOTOR_3",
]

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


@dataclass
class Modelo:
    """Artefato de clustering carregado do disco."""

    preprocessador: object
    kmeans: object
    features: list[str]
    perfis: dict[int, str]
    centroides_orig: pd.DataFrame  # centroides em unidade original
    stats: pd.DataFrame | None     # perfis_resumo.csv, se disponivel

    @property
    def k(self) -> int:
        return int(self.kmeans.n_clusters)


# --------------------------------------------------------------------------- #
# Carga
# --------------------------------------------------------------------------- #


def carregar(caminho: str | Path = MODELO_PADRAO, resumo: str | Path | None = None) -> Modelo:
    """Carrega o modelo salvo e, se existir, as estatisticas dos perfis."""
    caminho = Path(caminho).expanduser()
    if not caminho.exists():
        sys.exit(
            f"[erro] modelo nao encontrado: {caminho}\n"
            "       rode antes: python clustering_perfis_alunos.py"
        )

    art = joblib.load(caminho)
    pre, km = art["preprocessador"], art["kmeans"]
    features = list(art["features"])
    perfis = {int(c): n for c, n in art["perfis"].items()}

    centroides_orig = pd.DataFrame(
        pre.named_steps["scaler"].inverse_transform(km.cluster_centers_),
        columns=features,
    )

    # perfis_resumo.csv traz a taxa de evasao observada por cluster - opcional,
    # mas e o que transforma "cluster 3" em algo acionavel.
    stats = None
    caminho_resumo = Path(resumo) if resumo else caminho.parent / "perfis_resumo.csv"
    if caminho_resumo.exists():
        try:
            stats = pd.read_csv(caminho_resumo, index_col=0)
        except Exception as exc:
            print(f"[aviso] nao foi possivel ler {caminho_resumo.name}: {exc}", file=sys.stderr)

    return Modelo(pre, km, features, perfis, centroides_orig, stats)


# --------------------------------------------------------------------------- #
# Normalizacao da entrada
# --------------------------------------------------------------------------- #


def _num(valor) -> float:
    """Converte para float; texto nao numerico vira NaN (sera imputado)."""
    try:
        v = float(valor)
    except (TypeError, ValueError):
        return np.nan
    return v


def montar_linha(modelo: Modelo, dados, ordem: str = "modelo") -> pd.DataFrame:
    """Normaliza qualquer forma de entrada num DataFrame 1 x n_features.

    Aceita dict (por nome de coluna), Series, ou sequencia posicional.
    """
    if isinstance(dados, pd.DataFrame):
        return dados.reindex(columns=modelo.features).apply(pd.to_numeric, errors="coerce")

    if isinstance(dados, (dict, pd.Series)):
        d = dict(dados)
        desconhecidas = set(d) - set(COLUNAS_XLSX)
        if desconhecidas:
            print(f"[aviso] colunas ignoradas (fora do padrao do xlsx): {', '.join(sorted(desconhecidas))}",
                  file=sys.stderr)
        linha = {c: _num(d.get(c, np.nan)) for c in modelo.features}
        ausentes = [c for c in modelo.features if c not in d]
        if ausentes:
            print(f"[aviso] {len(ausentes)} feature(s) ausente(s), imputada(s) pela mediana do treino: "
                  f"{', '.join(ausentes)}", file=sys.stderr)
        return pd.DataFrame([linha])

    valores = list(dados)

    if ordem == "xlsx-completo":
        if len(valores) != len(COLUNAS_XLSX):
            sys.exit(f"[erro] --ordem xlsx-completo espera {len(COLUNAS_XLSX)} valores, recebeu {len(valores)}")
        d = dict(zip(COLUNAS_XLSX, valores))
        return pd.DataFrame([{c: _num(d[c]) for c in modelo.features}])

    if ordem == "xlsx":
        # As 20 features na ordem em que aparecem no xlsx (difere da ordem do
        # modelo: no xlsx SEM_ESPACO_CALOURO vem antes de ENTRADA_TARDIA).
        ordem_xlsx = [c for c in COLUNAS_XLSX if c in modelo.features]
        if len(valores) != len(ordem_xlsx):
            sys.exit(f"[erro] --ordem xlsx espera {len(ordem_xlsx)} valores, recebeu {len(valores)}")
        d = dict(zip(ordem_xlsx, valores))
        return pd.DataFrame([{c: _num(d[c]) for c in modelo.features}])

    if len(valores) == len(COLUNAS_XLSX):
        # Linha crua do xlsx passada sem flag - trata pelo tamanho.
        d = dict(zip(COLUNAS_XLSX, valores))
        return pd.DataFrame([{c: _num(d[c]) for c in modelo.features}])

    if len(valores) != len(modelo.features):
        sys.exit(
            f"[erro] esperava {len(modelo.features)} valores (ordem do modelo) ou "
            f"{len(COLUNAS_XLSX)} (linha completa do xlsx), recebeu {len(valores)}.\n"
            "       veja a ordem exata com: python prever_cluster.py --features"
        )

    return pd.DataFrame([{c: _num(v) for c, v in zip(modelo.features, valores)}])


# --------------------------------------------------------------------------- #
# Predicao
# --------------------------------------------------------------------------- #


def prever(modelo: Modelo, dados, ordem: str = "modelo") -> dict:
    """Classifica um aluno e devolve o diagnostico completo."""
    return prever_lote(modelo, montar_linha(modelo, dados, ordem))[0]


def prever_lote(modelo: Modelo, X: pd.DataFrame) -> list[dict]:
    """Versao vetorizada: classifica varios alunos de uma vez."""
    X = X.reindex(columns=modelo.features).apply(pd.to_numeric, errors="coerce")
    Z = modelo.preprocessador.transform(X)

    distancias = modelo.kmeans.transform(Z)  # distancia a cada centroide
    clusters = distancias.argmin(axis=1)

    resultados = []
    for i, cluster in enumerate(clusters):
        cluster = int(cluster)
        d = distancias[i]
        ordenados = np.argsort(d)
        segundo = int(ordenados[1]) if len(ordenados) > 1 else cluster

        # Quao "no meio" o aluno esta: 1.0 = colado no seu centroide,
        # perto de 0 = empatado com o segundo perfil mais proximo.
        margem = float((d[segundo] - d[cluster]) / d[segundo]) if d[segundo] > 0 else 0.0

        res = {
            "cluster": cluster,
            "nm_perfil": modelo.perfis.get(cluster, f"C{cluster}"),
            "distancia_centroide": float(d[cluster]),
            "segundo_perfil": modelo.perfis.get(segundo, f"C{segundo}"),
            "distancia_segundo": float(d[segundo]),
            "margem": round(margem, 4),
            "distancias": {modelo.perfis.get(int(c), f"C{c}"): float(v) for c, v in enumerate(d)},
        }

        if modelo.stats is not None and cluster in modelo.stats.index:
            linha = modelo.stats.loc[cluster]
            if "media_FL_EVADIU_OU_INTENCIONOU" in linha:
                res["taxa_evasao_perfil"] = round(100 * float(linha["media_FL_EVADIU_OU_INTENCIONOU"]), 2)
            if "qt_alunos" in linha:
                res["alunos_no_perfil"] = int(linha["qt_alunos"])

        # O que mais afasta este aluno do centro do proprio grupo.
        centro = modelo.centroides_orig.loc[cluster]
        aluno = X.iloc[i]
        desvio = (aluno - centro).abs().sort_values(ascending=False)
        res["diferencas_vs_centroide"] = [
            {
                "variavel": var,
                "rotulo": ROTULOS.get(var, var),
                "aluno": None if pd.isna(aluno[var]) else float(aluno[var]),
                "centroide": round(float(centro[var]), 2),
            }
            for var in desvio.index[:5]
        ]

        resultados.append(res)

    return resultados


# --------------------------------------------------------------------------- #
# Apresentacao
# --------------------------------------------------------------------------- #


def imprimir(res: dict, modelo: Modelo) -> None:
    print()
    print(f"  Perfil:      {res['nm_perfil']}")
    print(f"  Cluster:     {res['cluster']} de {modelo.k}")
    if "taxa_evasao_perfil" in res:
        print(f"  Evasao do perfil: {res['taxa_evasao_perfil']:.1f}% "
              f"({res.get('alunos_no_perfil', 0):,} alunos na base de treino)")
    print(f"  Distancia ao centroide: {res['distancia_centroide']:.3f}")
    print(f"  2o perfil mais proximo: {res['segundo_perfil']} (dist. {res['distancia_segundo']:.3f})")

    margem = res["margem"]
    if margem < 0.05:
        leitura = "aluno na fronteira entre dois perfis - trate o resultado com cautela"
    elif margem < 0.20:
        leitura = "encaixe moderado"
    else:
        leitura = "encaixe claro no perfil"
    print(f"  Margem: {margem:.1%} ({leitura})")

    print("\n  Maiores diferencas em relacao ao aluno tipico do perfil:")
    for d in res["diferencas_vs_centroide"]:
        aluno = "n/d" if d["aluno"] is None else f"{d['aluno']:g}"
        print(f"    - {d['rotulo']}: aluno = {aluno} | centroide = {d['centroide']:g}")
    print()


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #


def main() -> None:
    p = argparse.ArgumentParser(
        description="Classifica um estudante em um dos perfis treinados.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Exemplo:\n  python prever_cluster.py 36 0 0 1 0 0 46 14 3 100 6 80 4 100 0 55 10 0 0 0",
    )
    p.add_argument("valores", nargs="*", help="dados do aluno como array de numeros")
    p.add_argument("--modelo", default=MODELO_PADRAO, help="caminho do modelo_clusters.joblib")
    p.add_argument("--ordem", choices=["modelo", "xlsx", "xlsx-completo"], default="modelo",
                   help="como interpretar o array posicional (padrao: ordem do modelo)")
    p.add_argument("--json", dest="entrada_json", default=None,
                   help="dados por nome de coluna: string JSON, arquivo, ou '-' para stdin")
    p.add_argument("--lote", default=None, help="CSV com varias linhas e colunas nomeadas")
    p.add_argument("--saida-lote", default=None, help="CSV de saida para o modo --lote")
    p.add_argument("--formato", choices=["texto", "json"], default="texto")
    p.add_argument("--features", action="store_true",
                   help="lista a ordem esperada das features e sai")
    args = p.parse_args()

    modelo = carregar(args.modelo)

    if args.features:
        print(f"\nModelo: {args.modelo}  (k={modelo.k}, {len(modelo.features)} features)\n")
        print("Ordem esperada por --ordem modelo (padrao):")
        for i, c in enumerate(modelo.features):
            print(f"  {i:2d}. {c:<34} {ROTULOS.get(c, '')}")
        print("\nOrdem esperada por --ordem xlsx:")
        for i, c in enumerate([c for c in COLUNAS_XLSX if c in modelo.features]):
            print(f"  {i:2d}. {c}")
        print("\nPerfis:")
        for c, n in sorted(modelo.perfis.items()):
            print(f"  {c}: {n}")
        print()
        return

    # ---- lote ----
    if args.lote:
        df = pd.read_csv(args.lote)
        faltando = [c for c in modelo.features if c not in df.columns]
        if faltando:
            print(f"[aviso] colunas ausentes no CSV, imputadas pela mediana: {', '.join(faltando)}",
                  file=sys.stderr)
        resultados = prever_lote(modelo, df)
        saida = pd.DataFrame(
            {
                "cluster": [r["cluster"] for r in resultados],
                "nm_perfil": [r["nm_perfil"] for r in resultados],
                "distancia_centroide": [round(r["distancia_centroide"], 4) for r in resultados],
                "margem": [r["margem"] for r in resultados],
                "taxa_evasao_perfil": [r.get("taxa_evasao_perfil") for r in resultados],
            }
        )
        if "ID_ALUNO" in df.columns:
            saida.insert(0, "ID_ALUNO", df["ID_ALUNO"].values)

        if args.saida_lote:
            saida.to_csv(args.saida_lote, index=False)
            print(f"[saida] {args.saida_lote} ({len(saida):,} alunos)")
        else:
            print(saida.to_string(index=False))
        return

    # ---- aluno unico ----
    if args.entrada_json is not None:
        texto = args.entrada_json
        if texto == "-":
            texto = sys.stdin.read()
        elif Path(texto).expanduser().exists():
            texto = Path(texto).expanduser().read_text(encoding="utf-8")
        try:
            dados = json.loads(texto)
        except json.JSONDecodeError as exc:
            sys.exit(f"[erro] JSON invalido: {exc}")
        if isinstance(dados, list):
            resultado = prever(modelo, dados, args.ordem)
        else:
            resultado = prever(modelo, dados)
    elif args.valores:
        resultado = prever(modelo, args.valores, args.ordem)
    else:
        p.print_help()
        sys.exit("\n[erro] informe os dados do aluno (array, --json ou --lote).")

    if args.formato == "json":
        print(json.dumps(resultado, ensure_ascii=False, indent=2))
    else:
        imprimir(resultado, modelo)


if __name__ == "__main__":
    main()
