# ENERGYM | App do aluno

Protótipo funcional do aplicativo do aluno da **ENERGYM**, a academia autossustentável em que as máquinas de treino têm geradores. O esforço do aluno vira energia elétrica, o sensor IoT do aparelho mede essa energia e o app converte em pontos para trocar por recompensas na unidade.

Projeto acadêmico | PUC-Campinas

**Site publicado:** https://energymapp.netlify.app

## O que o app faz

- **Entrada** com nome, unidade e consentimento da LGPD
- **Início:** energia gerada no dia, pontos, sequência de dias, nível, gráfico da semana e energia da unidade (solar, alunos e piso piezoelétrico)
- **Treinar:** escolha do aparelho e da meta, pareamento com o sensor e treino ao vivo com watts, Wh, pontos e calorias em tempo real
- **Check-in no piso piezoelétrico:** os passos do dia viram pontos
- **Loja de recompensas:** resgate com controle de saldo e estoque e código de retirada com QR code
- **Ranking** da unidade (7 e 30 dias) e meta coletiva do mês
- **Perfil:** conquistas, histórico de treinos, privacidade (LGPD) e notificações
- Funciona como **app instalável** no celular (PWA) e abre sem internet depois do primeiro acesso

Os dados ficam salvos no próprio navegador (`localStorage`). Não há servidor nem banco externo nesta versão.

## Estrutura e divisão do grupo

| Integrante | Responsabilidade | Arquivos |
|---|---|---|
| **Marcos** | Banco de dados e servidor | `js/util.js`, `js/dados.js`, `sw.js`, `manifest.webmanifest`, `_headers`, `icons/`, `README.md` |
| **Arthur** | Backend (regras de negócio) | `js/regras.js`, `js/sessao.js` |
| **Rocha** | Frontend | `index.html`, `css/estilo.css`, `js/icones.js`, `js/telas.js`, `js/app.js`, `js/vendor/`, `fonts/` |

Ordem de carregamento dos scripts (definida no `index.html`):

```
vendor/qrcode.min.js → util.js → dados.js → regras.js → sessao.js → icones.js → telas.js → app.js
```

## Regras de demonstração

Valores definidos para o protótipo, ajustáveis no início de `js/dados.js`:

| Regra | Valor |
|---|---|
| Conversão de energia | 1 Wh = 2 pontos |
| Piso piezoelétrico | 20 passos = 1 ponto |
| Subida de nível | a cada 500 Wh acumulados |
| Meta diária | 150 Wh |
| Carga de um celular | 15 Wh |

A leitura do sensor é simulada em `js/sessao.js`. Na versão final, os watts viriam da plataforma IoT dos aparelhos.

## Como rodar

Abra a pasta com um servidor local, por exemplo:

```bash
python -m http.server 8000
```

e acesse `http://localhost:8000`.

## Publicação

O site é publicado no Netlify. Basta arrastar a pasta do projeto em **Deploys** ou conectar este repositório ao Netlify para publicar a cada push.

## Créditos

- Fontes Oswald e Manrope: SIL Open Font License 1.1 (licenças em `fonts/`)
- Biblioteca qrcode-generator (Kazuhiko Arase): MIT License
- Ícones no estilo Lucide (ISC License)
