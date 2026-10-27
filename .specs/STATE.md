# STATE

## Decisions

Decisões de projeto ficam em `docs/DESIGN.md` (inclui A1, §5.5) e nas tabelas de Assumptions de cada `spec.md`.

### AD-001 - Código em inglês, documentos em português

- **Data:** 2026-10-27
- **Decisão:** todo o código usa termos em inglês, inclusive o vocabulário do jogo: identificadores, tipos de mensagem, campos do protocolo, códigos de erro e motivos (`host`, `round`, `lobby`, `kicked`). Os documentos (`docs/`, `.specs/`) explicam em português, com os termos técnicos em inglês.
- **Motivo:** o idioma do jogo muda com o pacote de dicionário (pt-BR hoje, EN depois). O texto que o jogador vê sai do i18n da interface (DESIGN §5.1), nunca do código nem do protocolo.
- user: "o codigo deve ter todos os termos em ingles, mas pode manter a explicação dos documentos em portuguez"

## Handoff

- **Data:** 2026-10-27
- **Marcos concluídos:**
  - M0 (`m0-dictionary-spike`): Done, verificado.
  - M1 (`m1-dictionary-pack`): Done, verificado (`validate_verification` 0 erros, 64 provas, 3 mutações mortas).
  - M2 (`m2-room-server`): Done, verificado (`validate_verification` 0 erros, 95 provas, 3 mutações mortas; Verifier achou 3 problemas, todos fechados).
- **Branch:** `main`. `origin/main` está em `3cf7261` (push de 2026-10-27, pedido pelo user, com o M2 completo e a página de debug).
- **Ferramenta de debug:** `npm run debug` sobe o `wrangler dev` (8787) e a página `tools/debug` em http://localhost:5174 (commit `f7bb7e4`). Lista de jogadores atualiza placar e vitórias depois do resultado e do pódio (T32, `27ead32`).
- **Próximo passo:** especificar o M3 (celular).
- **Pendências conhecidas:** nenhuma. Resolvidas em 2026-10-27: teste do Playwright do M1 que falhava às vezes (`c877042`) e `lastActionAt` de envio recusado gravado no storage.
- **Modo de execução preferido pelo usuário:** subagentes, uma fase por vez, parando para mostrar o resultado e perguntar antes da próxima fase.
- **Bloqueios:** nenhum.
- **Arquivos não commitados:** nenhum.
- **Ambiente Windows:** os scripts da skill precisam de `PYTHONUTF8=1` e de `PYTHONPATH` apontando para uma pasta com um `sitecustomize.py`. Esse arquivo mapeia `signal.SIGHUP` para `SIGTERM` e resolve launchers `.cmd` como o `npx` via `shutil.which`. A cópia atual fica no scratchpad da sessão e precisa ser recriada se sumir.
