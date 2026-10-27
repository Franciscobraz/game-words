# STATE

## Decisions

Decisões de projeto ficam em `docs/DESIGN.md` (inclui A1, §5.5) e nas tabelas de Assumptions de cada `spec.md`.

## Handoff

- **Data:** 2026-10-26
- **Marcos concluídos:**
  - M0 (`m0-dictionary-spike`): Done, verificado.
  - M1 (`m1-dictionary-pack`): Done, verificado (`validate_verification` 0 erros, 64 provas, 3 mutações mortas).
- **Branch:** `main`. `origin/main` está em `21757c1`. Os commits do M1 são só locais: o usuário decidiu não publicar por enquanto.
- **Próximo passo:** especificação do M2 (salas no Durable Object, protocolo WebSocket, anfitrião, reconexão, persistência, expiração configurável; DESIGN §2 e §6). Começar pelo Specify do `tlc-spec-driven`, com perguntas antes da spec.
- **Modo de execução preferido pelo usuário:** subagentes, uma fase por vez, parando para mostrar o resultado e perguntar antes da próxima fase.
- **Bloqueios:** nenhum.
- **Arquivos não commitados:** nenhum.
- **Ambiente Windows:** os scripts da skill precisam de `PYTHONUTF8=1` e de `PYTHONPATH` apontando para uma pasta com um `sitecustomize.py`. Esse arquivo mapeia `signal.SIGHUP` para `SIGTERM` e resolve launchers `.cmd` como o `npx` via `shutil.which`. A cópia atual fica no scratchpad da sessão e precisa ser recriada se sumir.
