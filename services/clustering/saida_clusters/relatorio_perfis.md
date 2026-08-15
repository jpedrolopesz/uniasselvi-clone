# Perfis de alunos - clustering k-means

- Alunos analisados: **457,427**
- Numero de perfis (k): **8**
- Silhouette (amostra): **0.1391**
- Variaveis usadas: 20

Taxa media de evasao/intencao na base: **9.9%**

## Visao geral

| Perfil | Alunos | % base | % evasao/intencao | Proba media do modelo |
|---|---|---|---|---|
| C0 - Intermitente (Acessou Conheca EAD baixo) | 56,386 | 12.3% | 8.8% | 13.0 |
| C1 - Regular (% atividades entregues alto) | 65,619 | 14.3% | 7.1% | 13.6 |
| C2 - Intermitente (Acessou Conheca EAD alto) | 49,457 | 10.8% | 8.9% | 17.5 |
| C3 - Desengajado (Desempenho - atividades baixo) | 69,331 | 15.2% | 18.9% | 40.1 |
| C4 - Regular (Respondeu quest. Conheca EAD alto) | 55,408 | 12.1% | 8.8% | 14.2 |
| C5 - Regular (Respondeu quest. Espaco Calouro alto) | 53,827 | 11.8% | 5.7% | 14.4 |
| C6 - Desengajado (Entrada tardia alto) | 47,389 | 10.4% | 13.8% | 33.8 |
| C7 - Regular (Respondeu quest. Espaco Calouro alto) | 60,010 | 13.1% | 6.3% | 14.2 |

## Detalhe por perfil

### C0 - Intermitente (Acessou Conheca EAD baixo)

56,386 alunos (12.3% da base)
- Evasao/intencao observada: 8.8%
- Probabilidade media de evasao (modelo): 13.0
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **Acessou Conheca EAD**: -0.88 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.4
- **Respondeu quest. Espaco Calouro**: -0.70 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.3
- **% atividades entregues**: -0.59 desvios (abaixo da media) | media do grupo = 0.1 vs. base = 17.8
- **Qtde de atividades entregues**: -0.57 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.9
- **Desempenho - atividades**: +0.56 desvios (acima da media) | media do grupo = 86.2 vs. base = 62.5
- **Desempenho - provas**: +0.53 desvios (acima da media) | media do grupo = 57.8 vs. base = 38.9

### C1 - Regular (% atividades entregues alto)

65,619 alunos (14.3% da base)
- Evasao/intencao observada: 7.1%
- Probabilidade media de evasao (modelo): 13.6
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **% atividades entregues**: +1.21 desvios (acima da media) | media do grupo = 53.9 vs. base = 17.8
- **Qtde de atividades entregues**: +1.20 desvios (acima da media) | media do grupo = 2.8 vs. base = 0.9
- **Respondeu quest. Espaco Calouro**: -0.70 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.3
- **Dias totais de acesso ao AVA**: +0.57 desvios (acima da media) | media do grupo = 6.6 vs. base = 4.1
- **Acessos ao AVA na semana de atividades**: +0.54 desvios (acima da media) | media do grupo = 2.1 vs. base = 1.3
- **Dias ate o 1o acesso**: +0.49 desvios (acima da media) | media do grupo = 727.8 vs. base = 453.0

### C2 - Intermitente (Acessou Conheca EAD alto)

49,457 alunos (10.8% da base)
- Evasao/intencao observada: 8.9%
- Probabilidade media de evasao (modelo): 17.5
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **Acessou Conheca EAD**: +1.13 desvios (acima da media) | media do grupo = 1.0 vs. base = 0.4
- **Respondeu quest. Espaco Calouro**: -0.70 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.3
- **% atividades entregues**: -0.46 desvios (abaixo da media) | media do grupo = 4.2 vs. base = 17.8
- **Qtde de atividades entregues**: -0.43 desvios (abaixo da media) | media do grupo = 0.2 vs. base = 0.9
- **% de conclusao do curso**: +0.41 desvios (acima da media) | media do grupo = 37.3 vs. base = 26.3
- **Respondeu quest. Conheca EAD**: -0.38 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.1

### C3 - Desengajado (Desempenho - atividades baixo)

69,331 alunos (15.2% da base)
- Evasao/intencao observada: 18.9%
- Probabilidade media de evasao (modelo): 40.1
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **Desempenho - atividades**: -1.33 desvios (abaixo da media) | media do grupo = 6.4 vs. base = 62.5
- **Desempenho - provas**: -1.04 desvios (abaixo da media) | media do grupo = 1.6 vs. base = 38.9
- **Desempenho - media final**: -0.98 desvios (abaixo da media) | media do grupo = 1.6 vs. base = 39.7
- **% disciplinas aprovadas**: -0.73 desvios (abaixo da media) | media do grupo = 0.3 vs. base = 16.9
- **% engajamento financeiro**: -0.65 desvios (abaixo da media) | media do grupo = 57.3 vs. base = 81.1
- **Acessos ao AVA na semana de atividades**: -0.64 desvios (abaixo da media) | media do grupo = 0.4 vs. base = 1.3

### C4 - Regular (Respondeu quest. Conheca EAD alto)

55,408 alunos (12.1% da base)
- Evasao/intencao observada: 8.8%
- Probabilidade media de evasao (modelo): 14.2
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **Respondeu quest. Conheca EAD**: +2.66 desvios (acima da media) | media do grupo = 1.0 vs. base = 0.1
- **Acessou Conheca EAD**: +1.13 desvios (acima da media) | media do grupo = 1.0 vs. base = 0.4
- **Respondeu quest. Espaco Calouro**: +0.46 desvios (acima da media) | media do grupo = 0.5 vs. base = 0.3
- **Desempenho - atividades**: +0.42 desvios (acima da media) | media do grupo = 80.4 vs. base = 62.5
- **% de conclusao do curso**: +0.35 desvios (acima da media) | media do grupo = 35.8 vs. base = 26.3
- **Desempenho - media final**: +0.34 desvios (acima da media) | media do grupo = 53.0 vs. base = 39.7

### C5 - Regular (Respondeu quest. Espaco Calouro alto)

53,827 alunos (11.8% da base)
- Evasao/intencao observada: 5.7%
- Probabilidade media de evasao (modelo): 14.4
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **Respondeu quest. Espaco Calouro**: +1.42 desvios (acima da media) | media do grupo = 1.0 vs. base = 0.3
- **Acessou Conheca EAD**: -0.88 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.4
- **Desempenho - atividades**: +0.46 desvios (acima da media) | media do grupo = 81.8 vs. base = 62.5
- **% disciplinas aprovadas**: +0.43 desvios (acima da media) | media do grupo = 26.6 vs. base = 16.9
- **Respondeu quest. Conheca EAD**: -0.38 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.1
- **Desempenho - media final**: +0.35 desvios (acima da media) | media do grupo = 53.2 vs. base = 39.7

### C6 - Desengajado (Entrada tardia alto)

47,389 alunos (10.4% da base)
- Evasao/intencao observada: 13.8%
- Probabilidade media de evasao (modelo): 33.8
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **Entrada tardia**: +1.72 desvios (acima da media) | media do grupo = 1.0 vs. base = 0.3
- **Desempenho - atividades**: -1.04 desvios (abaixo da media) | media do grupo = 18.6 vs. base = 62.5
- **Desempenho - provas**: -0.85 desvios (abaixo da media) | media do grupo = 8.4 vs. base = 38.9
- **Desempenho - media final**: -0.80 desvios (abaixo da media) | media do grupo = 8.5 vs. base = 39.7
- **% de conclusao do curso**: -0.67 desvios (abaixo da media) | media do grupo = 8.3 vs. base = 26.3
- **Dias ate o 1o acesso**: -0.65 desvios (abaixo da media) | media do grupo = 91.4 vs. base = 453.0

### C7 - Regular (Respondeu quest. Espaco Calouro alto)

60,010 alunos (13.1% da base)
- Evasao/intencao observada: 6.3%
- Probabilidade media de evasao (modelo): 14.2
- Tipo de aluno predominante: VETERANO

O que distingue este perfil (desvio vs. media da base):

- **Respondeu quest. Espaco Calouro**: +1.42 desvios (acima da media) | media do grupo = 1.0 vs. base = 0.3
- **Acessou Conheca EAD**: +1.13 desvios (acima da media) | media do grupo = 1.0 vs. base = 0.4
- **Desempenho - atividades**: +0.49 desvios (acima da media) | media do grupo = 83.2 vs. base = 62.5
- **% disciplinas aprovadas**: +0.46 desvios (acima da media) | media do grupo = 27.2 vs. base = 16.9
- **Desempenho - media final**: +0.39 desvios (acima da media) | media do grupo = 55.0 vs. base = 39.7
- **Respondeu quest. Conheca EAD**: -0.38 desvios (abaixo da media) | media do grupo = 0.0 vs. base = 0.1
