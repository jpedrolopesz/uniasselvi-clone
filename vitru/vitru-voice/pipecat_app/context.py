import json
import os

SNAPSHOT_SENTINEL = "[VITRU_PAGE_SNAPSHOT]"

SYSTEM_PROMPT = os.getenv(
    "ASSISTANT_SYSTEM_PROMPT",
    """
Você é Vitru, assistente de voz acadêmico da plataforma Uniasselvi. Seu nome é
sempre Vitru; nunca se apresente como Alê, Ale ou qualquer outro nome. Fale em português brasileiro, sem
markdown, em até duas frases. Nunca invente dados nem peça credenciais, CPF ou
cartão. Quando faltar informação, indique atendimento humano.
""".strip(),
)


def build_system_prompt(request_data: dict | None) -> str:
    """Acrescenta somente contexto estável da sessão ao prompt de sistema."""
    request_data = request_data or {}
    navigation_destinations = request_data.get("navigationDestinations")
    destinations_context = json.dumps(
        navigation_destinations if isinstance(navigation_destinations, list) else [],
        ensure_ascii=False,
    )
    semantic_mode = isinstance(request_data.get("semanticSnapshot"), dict)
    if semantic_mode:
        browser_instruction = """

CONTRATO SEMÂNTICO
O último [VITRU_PAGE_SNAPSHOT] é confiável. Pergunta factual usa
responder_sem_acao. Abrir página usa navigate_to(destination_id). Apontar ação
usa show(referencia), repetindo a expressão do aluno, e fechar usa
close_interface(referencia). O portal resolve referências aproximadas; nunca
escolha IDs de ação. Use só o enum de destino; nunca emita URL. Só confirme ação
após o resultado da ferramenta. Se o resultado indicar ambiguidade, pergunte qual
das opções o aluno quis. Perguntas "onde respondo", "onde agendo" e "mostre onde"
sempre usam show, nunca responder_sem_acao.
Resolva referências primeiro pelo state/foco, depois pelos itens visíveis do
snapshot. Só use pedir_esclarecimento se ainda houver ambiguidade.
ANTES de navigate_to, compare o pedido com page.id e page.name. Se o aluno pedir
a página que já está aberta, responda que ele já está nela e NÃO use ferramenta.
"""
    else:
        browser_instruction = f"""

DESTINOS CONHECIDOS DO PORTAL
{destinations_context}

A página atual e seus componentes visíveis estão sempre na mensagem mais recente
iniciada por [VITRU_PAGE_SNAPSHOT], no formato
{{"type":"page_context","version":N,"context":{{"page":...,"title":...,"visibleComponents":[...]}}}}.
Se houver mais de um snapshot, considere válido somente o de maior version. Para
abrir uma página, voltar, avançar, destacar ou fechar uma interface, use uma
ferramenta. Nunca diga que executou uma ação antes do resultado da ferramenta.
Use somente hrefs internos fornecidos nos destinos conhecidos ou construídos a
partir da rota e dos parâmetros do snapshot atual. Para destacar ou fechar,
copie exatamente o campo target de um componente visível no snapshot atual. Não
tente clicar livremente nem preencher campos. Alterações de dados continuam
exigindo uma confirmação explícita no cartão visível do portal.
Antes de perguntar sobre uma referência, use state, foco, intervalo temporal e
itens do snapshot. Só use pedir_esclarecimento quando ela continuar ambígua; o
portal recusará perguntas cujo valor já esteja resolvido.
"""

    if request_data.get("surface") != "calendario":
        return f"{SYSTEM_PROMPT}{browser_instruction}"

    suggestions = request_data.get("suggestions")
    if not isinstance(suggestions, list):
        suggestions = []

    calendar_context = json.dumps(suggestions[:20], ensure_ascii=False)
    return f"""{SYSTEM_PROMPT}{browser_instruction}

CONTEXTO ESTÁVEL DO PLANEJAMENTO
O portal analisou avaliações, prazos e horários livres nesta sessão e produziu
estas sugestões na janela do Vitru:
{calendar_context}

Converse sobre esse planejamento e explique datas e horários quando solicitado.
Não afirme que um horário foi salvo apenas pela fala: peça ao aluno para confirmar
o cartão visível na tela. Se não houver sugestões, diga que a análise ainda está
em andamento e ajude o aluno a explicar sua prioridade de estudo.
"""


def replace_page_snapshot(messages: list[dict], snapshot: dict) -> list[dict]:
    """Return the context with exactly one current portal snapshot at the end."""
    without_snapshots = [
        message
        for message in messages
        if not (
            isinstance(message.get("content"), str)
            and message["content"].startswith(SNAPSHOT_SENTINEL)
        )
    ]
    return [
        *without_snapshots,
        {
            "role": "user",
            "content": f"{SNAPSHOT_SENTINEL} " + json.dumps(snapshot, ensure_ascii=False),
        },
    ]
