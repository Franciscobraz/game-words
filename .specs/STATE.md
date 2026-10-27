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
- **Branch:** `main`. `origin/main` está em `21757c1`. Os commits do M1 são só locais: o usuário decidiu não publicar por enquanto.
- **Em andamento:** M2 (`m2-room-server`): spec aprovada e emendada; `design.md` aprovado em 2026-10-27 (abordagem A: regras puras em `core/room`, DO como adaptador).
- **Próximo passo:** aprovação do `tasks.md` do M2 (26 tarefas em 4 fases, 81 checks); depois, Execute com um subagente por fase e parada entre fases.
- **Modo de execução preferido pelo usuário:** subagentes, uma fase por vez, parando para mostrar o resultado e perguntar antes da próxima fase.
- **Bloqueios:** nenhum.
- **Arquivos não commitados:** nenhum.
- **Ambiente Windows:** os scripts da skill precisam de `PYTHONUTF8=1` e de `PYTHONPATH` apontando para uma pasta com um `sitecustomize.py`. Esse arquivo mapeia `signal.SIGHUP` para `SIGTERM` e resolve launchers `.cmd` como o `npx` via `shutil.which`. A cópia atual fica no scratchpad da sessão e precisa ser recriada se sumir.
