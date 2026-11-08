---
name: commit
description: Crea un commit del trabajo ya revisado. Solo se invoca con /commit.
disable-model-invocation: true
---

# /commit

1. Revisa `git status` y `git diff`. No incluyas `.env` ni archivos con claves.
2. El mensaje dice por qué cambia el proyecto, en una o dos frases.
3. No uses `--no-verify`. No enmiendes un commit que no sea de esta sesión o que ya esté en el remoto.
4. Después de commitear, muestra `git status`.
