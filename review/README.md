# Revisão espaçada (caixas Leitner)

Convenção de revisão do projeto (SYS-03, D-01/D-02): 3 níveis fixos, sem cálculo de datas.

## As 3 caixas

1. `box-1-ainda-nao-sei/` ("Ainda não sei") — mais urgente, revisar quase toda sessão
2. `box-2-quase-la/` ("Quase lá") — reconhecido parcialmente, revisão intermediária
3. `box-3-ja-sei/` ("Já sei") — consolidado, revisão de manutenção

Os nomes das pastas espelham exatamente os 3 botões de auto-avaliação do widget de intervalo (e de futuros widgets de drill).

## Como revisar

Cada item de revisão é um arquivo `.md` curto (o conceito a re-testar). "Revisar" é literalmente **mover o arquivo** entre pastas — sem frontmatter de data, sem algoritmo SM-2/FSRS:

- Acertou de ouvido → mover o arquivo para a caixa seguinte (ex.: `box-1` → `box-2`)
- Errou → mover de volta para `box-1-ainda-nao-sei/`

Essa lógica de transição espelha `nextBox()` em [`widgets/lib/review.js`](../widgets/lib/review.js) (forward = avança uma caixa, back = volta pra caixa 1/anterior, com clamp nas pontas).

## Quando criar um novo item

Sempre que uma dificuldade específica se repetir em uma sessão (ex.: confundir dois intervalos, uma qualidade de acorde específica), criar um `.md` curto descrevendo o conceito em `box-1-ainda-nao-sei/`.

Zero itens numa caixa é esperado e bom — significa nada pendente de revisão urgente ali.
