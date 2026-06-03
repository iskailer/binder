# Fluxos de usuario

## Criar jogador

1. Abrir o app.
2. Informar apelido.
3. App gera `id`, avatar, nivel 1, XP 0 e titulo inicial.
4. Jogador ativo fica salvo no `localStorage`.

## Iniciar evento

1. Tocar em `Iniciar Evento`.
2. App cria evento aberto com `createdAt` atual.
3. Jogador ativo entra em `participants`.
4. Nome, descricao, local e vibe podem ser editados depois.

## Fechar evento

### Manual

1. Abrir tela de evento.
2. Tocar em `Encerrar evento`.
3. App calcula ranking e grava `rankingSnapshot`.
4. Evento recebe status `closed` e `endedAt`.

### Automatico

1. Em cada carga do app, `eventService.closeExpiredEvents()` roda.
2. Se a janela de 2 dias foi ultrapassada, o evento fecha.
3. Eventos fechados bloqueiam novas pontuacoes.

## Validar pontuacao

1. Jogador ativo escolhe categoria.
2. App captura GPS do jogador alvo.
3. Pedido fica salvo como `ValidationCode` com status `requested`.
4. Outro participante local seleciona o pedido e gera codigo.
5. App captura GPS do validador.
6. `validationRules` exige jogador diferente e distancia ate 30 metros.
7. Codigo fica ativo por 10 segundos.
8. Jogador alvo insere o codigo.
9. App valida uso unico, expiração, evento aberto e alvo correto.
10. App cria score `action` para o alvo.
11. App cria score `sidekick` para o validador.
12. XP, nivel, titulos, conquistas e ranking passam a refletir os novos scores.

## Ranking

1. Lista scores do evento.
2. Agrupa por jogador.
3. Soma pontos.
4. Desempata por quantidade de acoes.
5. Persistido como snapshot quando evento fecha.

## Offline

1. Service worker cacheia arquivos estaticos.
2. PouchDB salva dados no IndexedDB.
3. Header mostra estado online/offline.
4. Sem GPS, gerar codigo fica bloqueado com erro claro.
