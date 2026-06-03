# Roleta Brusca

MVP de um jogo social gamificado com tema de RPG nonsense brasileiro, feito para rodar como PWA offline-first, mobile-first e hospedavel no GitHub Pages. Integra Firebase Firestore para sincronizacao em nuvem quando online.

## O que ja funciona

- Cadastro local de jogadores com avatar automatico.
- Inicio de evento com um clique.
- Edicao de nome, descricao, local e vibe enquanto o evento esta aberto.
- Fechamento manual com snapshot local do ranking.
- Fechamento automatico por janela maxima de 2 dias de calendario.
- Categorias fixas carregadas no PouchDB.
- **Tela "Jogar"** com interface semelhante a categorias e mecanica de Sidekick.
- **Mecanica de Sidekick**: gera codigo temporario (15s) para parceiro pontuar junto.
- Validacao por codigo temporario de uso unico, com TTL de 15 segundos.
- Bloqueio de geracao de codigo sem geolocalizacao do navegador.
- Verificacao de proximidade configurada em 50 metros.
- Pontuacao por categoria e bonus separado de sidekick.
- Ranking local do evento com desempate por acoes e depois por chegada.
- XP, nivel, titulos e conquistas com indicacao de proximo titulo no Perfil.
- PWA com manifest, service worker e cache dos recursos estaticos.
- **Firebase Firestore** integrado via CDN (auth anonimo + persistencia de perfil/scores).
- **Painel Admin** para criar eventos geograficamente ativados e ver ranking em tempo real.
- **Busca de eventos proximos** na Home via API de Geolocalizacao (ate 50m).
- **Toast + Redirect** em todas as acoes de salvar/excluir.

## Firebase

O app usa Firebase Firestore como camada de nuvem opcional. Para configurar:

1. Crie um projeto no Firebase Console.
2. Edite `src/config/appConfig.js` e substitua os valores de `firebaseConfig`.
3. O app opera offline-first com PouchDB local e sincroniza para Firestore quando online.

Se Firebase nao estiver configurado ou indisponivel, o app continua 100% funcional offline.

## Como rodar localmente

Use um servidor estatico. Geolocalizacao funciona em `localhost` e em HTTPS.

```bash
python -m http.server 4173
```

Depois abra:

```text
http://localhost:4173
```

Na primeira abertura, o app precisa conseguir carregar o PouchDB e Firebase via CDN. Depois que o service worker instala e cacheia os arquivos, o app segue funcionando offline.

## Como publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie estes arquivos para a branch principal.
3. Em `Settings > Pages`, selecione deploy por branch.
4. Escolha a branch e a pasta raiz.
5. Abra a URL gerada pelo GitHub Pages.

Nao ha build step. O app usa caminhos relativos para funcionar em subpastas do GitHub Pages.

## Mecanica de Sidekick

1. Na tela "Jogar", o jogador A clica "Pontuar" em uma categoria.
2. Um codigo temporario e gerado com validade de **15 segundos**.
3. O jogador B digita o codigo no campo de validacao.
4. Ao validar: jogador B recebe os pontos da categoria, jogador A (sidekick) recebe bonus automatico.
5. O codigo e invalidado imediatamente apos uso (uso unico).

## Estrutura

```text
/index.html
/manifest.webmanifest
/sw.js
/assets
/src
  /config
  /data
  /domain
  /services
  /features
    /admin        (novo)
    /play         (novo - antiga "Codigo")
    /auth
    /home
    /players
    /events
    /categories
    /validation
    /ranking
    /profile
    /achievements
  /ui
  /utils
/DOCS
```

## Decisoes tecnicas

- JavaScript puro com ES modules para evitar build step.
- PouchDB local para persistencia offline.
- Firebase Firestore via CDN compat para sincronizacao em nuvem.
- Regras de negocio em `src/domain`.
- Persistencia isolada em `src/data`.
- Geolocalizacao, codigos, PWA, Firebase e orquestracao em `src/services`.
- UI organizada por feature em `src/features`.
- Service worker com estrategia cache-first para assets e fallback de navegacao para `index.html`.
- Codigo de sidekick com TTL de 15 segundos, uso unico, pontuacao dupla.
