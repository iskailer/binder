# Modelo de dados local

Todos os documentos sao salvos no PouchDB com `_id` no formato `tipo:id`.

## Player

```js
{
  id,
  name,
  avatarType,
  xp,
  level,
  titles,
  createdAt,
  lastSeenAt
}
```

## Event

```js
{
  id,
  name,
  description,
  locationLabel,
  vibe,
  status,
  createdAt,
  endedAt,
  participants,
  rankingSnapshot,
  maxDurationHours,
  closeReason
}
```

## Category

```js
{
  id,
  name,
  description,
  points,
  validationMode,
  fixed,
  active,
  createdAt
}
```

Categorias sao fixas e sem tela de criacao no MVP.

## ValidationCode

```js
{
  id,
  code,
  eventId,
  categoryId,
  generatedByPlayerId,
  targetPlayerId,
  createdAt,
  requestedAt,
  expiresAt,
  usedAt,
  status,
  targetLocation,
  validatorLocation,
  metadata
}
```

`targetLocation` e `validatorLocation` sao extensoes locais para validar proximidade sem backend.

## ScoreEntry

```js
{
  id,
  playerId,
  eventId,
  categoryId,
  points,
  type,
  validatedBy,
  createdAt,
  metadata
}
```

Tipos:

- `action`: pontuacao da categoria.
- `sidekick`: bonus para quem validou.

## Achievement

```js
{
  id,
  playerId,
  key,
  title,
  description,
  unlockedAt
}
```

## Consistencia

- Codigo ativo expira apos 10 segundos.
- Codigo usado nao volta para ativo.
- Antes de pontuar, o app verifica duplicidade por `metadata.validationCodeId`.
- Evento fechado nao aceita pontuacao.
- Ranking e XP sao recalculados a partir dos score entries.
