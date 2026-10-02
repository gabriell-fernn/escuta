# Escuta — código para baixar e editar

Exportado em 02/10/2026 a partir do commit `5bd60146c2b47f46269e6140986112e90dc56543`.

## Qual pasta usar?

- **escuta-nextjs/**: comece por esta. Versão do jogo preparada para executar em Next.js/Node.js fora do ChatGPT, com React, TypeScript e Tailwind CSS.
- **original-sites/**: cópia dos arquivos versionados da versão publicada, incluindo a configuração original de Vinext/Cloudflare/Sites. Serve como referência e backup. Não é a pasta indicada para os comandos abaixo.

O ZIP não inclui dependências instaladas, histórico Git, arquivos de ambiente privados, credenciais nem arquivos de áudio. As duas cópias incluem o código completo do jogo, seus componentes e endpoints.

## Rodar no computador

1. Instale Node.js 22.13 ou superior, com npm.
2. Extraia o ZIP e abra a pasta **escuta-nextjs** no VS Code.
3. No terminal dessa pasta, execute:

```sh
npm install
npm run dev
```

Abra http://localhost:3000. As alterações nos arquivos serão refletidas no ambiente de desenvolvimento.

## Arquivos principais

| Arquivo | O que editar |
| --- | --- |
| app/page.tsx | Tela e comportamento do jogo |
| app/globals.css | Cores, tipografia, tamanho e responsividade |
| components/game/filters.tsx | Menu de gênero, era e dificuldade |
| components/game/song-search.tsx | Campo de busca e sugestões |
| lib/game.ts | Tempos dos trechos e validação dos palpites |
| lib/popularity.ts | Divisão dos níveis de dificuldade |
| lib/artist-snapshot.json | Catálogo de artistas e dados de popularidade capturados |
| app/api/ | Rotas de busca, catálogo e áudio |
| public/ | Ícones e arquivos públicos |

## Compilar e executar em produção

```sh
npm run build
npm start
```

O comando de build usa Webpack e mantém a checagem de tipos. A configuração usa a API do TypeScript 5 para essa checagem.

## Publicar em outra hospedagem

Use uma plataforma com suporte a Next.js ou um servidor com Node.js. O jogo utiliza endpoints de servidor para consultar a Deezer e entregar as prévias; não é uma exportação de HTML estático.

Se publicar por um repositório Git:

1. Crie seu próprio repositório e envie o conteúdo de **escuta-nextjs/**.
2. Na hospedagem, selecione o projeto Next.js e a versão de Node compatível.
3. Configure a instalação como `npm install` e o build como `npm run build`.
4. Em um serviço Node convencional, configure o comando de início como `npm start`. Em uma plataforma com suporte nativo a Next.js, use o mecanismo de publicação da plataforma.
5. Se enviar este pacote inteiro ao Git, configure a raiz do projeto como `escuta-nextjs`.

Não envie `node_modules` nem `.next` ao Git. Após a primeira instalação, guarde o `package-lock.json` gerado no seu repositório; depois você poderá usar `npm ci` nas instalações automatizadas.

A versão independente não inclui o controle de acesso do ChatGPT. Configure autenticação na hospedagem se quiser restringir quem entra.

Documentação oficial: https://nextjs.org/docs/app/getting-started/deploying

## Fonte das músicas e funcionamento

A aplicação continua dependendo do acesso do servidor à API pública da Deezer e aos seus servidores de prévias. Não há chave de API nem banco de dados obrigatório nesta implementação. A disponibilidade, os limites e as respostas desse serviço externo podem afetar a busca e a reprodução na nova hospedagem.

Os metadados de popularidade dos artistas foram capturados em 01/10/2026; eles não se atualizam automaticamente. Os arquivos de áudio não fazem parte do pacote.

As edições feitas no seu computador ou na nova hospedagem não alteram automaticamente a versão que continua publicada no ChatGPT.

## Validação desta exportação

A versão independente compilou com sucesso com Next.js 16.3.4, incluindo a checagem de tipos e as seis rotas do jogo. A validação utilizou as dependências já disponíveis no ambiente; uma instalação nova com npm não foi executada. A API da Deezer não foi validada em uma nova hospedagem.
