# CCU Direct Terminal Client

CCU is a local macOS client for direct, authenticated access to a personal CCU
JupyterHub terminal. It uses the same REST and WebSocket APIs as JupyterLab.

If your JupyterHub-hosted server doubles as your daily driver, CCU gives you a
plain terminal in it — reattachable shell sessions, one-off command execution,
and small file transfers — from a native macOS CLI instead of the browser tab.

```text
Local Mac -> verified HTTPS/WSS -> CCU JupyterHub -> personal Jupyter terminal
```

There is no tunnel, relay, public listener, remote SSH daemon, or software
installation inside the Jupyter server. JupyterHub tokens remain exclusively in
macOS Keychain. See [SECURITY.md](https://github.com/vulonviing/ccu-jupyter-client/blob/main/SECURITY.md) for the full credential and
network model.

## Features

- Persistent, reattachable remote shell (`ccu shell`)
- Disposable one-off command execution (`ccu exec`)
- Small file upload/download with overwrite protection and checksum verification
- Config split between a non-secret local manifest and a Keychain-only token —
  a token never touches disk, an env var, or a log
- Strict URL, redirect, and TLS validation; no insecure fallback modes

## Quick start

Requirements: macOS, Python 3.11 or newer, [`uv`](https://docs.astral.sh/uv/), a
running personal Jupyter server, and access to the JupyterHub token page.

Install the local client from this directory:

```bash
bash install-local.sh
```

Create a private non-secret setup manifest:

```bash
cp ccu.example.toml ccu.local.toml
chmod 600 ccu.local.toml
```

Edit `ccu.local.toml` with the full browser URL for your own JupyterLab server.
Never add a token, password, cookie, or private key to this file.

```toml
schema_version = 1
profile = "personal"
server_url = "https://HOST/user/USERNAME/lab"
default_terminal = "ccu_main"
```

Import the manifest, store a 24-hour server-scoped token, and verify access:

```bash
ccu setup --config ccu.local.toml
ccu auth store personal
ccu doctor -p personal
ccu exec -p personal -- whoami
```

The last command should print `jovyan`. The setup manifest contains no
credential; runtime profile data is stored in `~/.config/ccu/profiles.toml` and
the live token is stored only in Keychain.

## Daily use

Open or reattach the persistent terminal:

```bash
ccu shell -p personal
```

Press `Ctrl-]` to detach without closing the remote terminal. Run a disposable
command with:

```bash
ccu exec -p personal -- nvidia-smi
```

Transfer individual files up to 25 MiB:

```bash
ccu upload -p personal local_script.py project/local_script.py
ccu download -p personal project/result.json result.json
```

Existing destinations require `--force`. Use Git or the platform-supported
transfer mechanism for repositories, datasets, checkpoints, and directories.

## Documentation

- [Setup guide](https://github.com/vulonviing/ccu-jupyter-client/blob/main/docs/SETUP.md): installation, manifest fields, token creation,
  migration, rotation, restart recovery, and uninstall.
- [CLI reference](https://github.com/vulonviing/ccu-jupyter-client/blob/main/docs/CLI.md): every command and safety-relevant option.
- [Security model](https://github.com/vulonviing/ccu-jupyter-client/blob/main/SECURITY.md): credential, network, terminal, and transfer
  guarantees.
- [Operational rules](https://github.com/vulonviing/ccu-jupyter-client/blob/main/RULES.md): resource use, lifecycle, and cleanup policy.
- [Architecture](https://github.com/vulonviing/ccu-jupyter-client/blob/main/ARCHITECTURE.md): component and data-flow boundaries.
- [Troubleshooting](https://github.com/vulonviing/ccu-jupyter-client/blob/main/TROUBLESHOOTING.md): exact failure recovery guidance.

## Developer validation

Run the complete repository gate from this directory:

```bash
bash scripts/validate.sh
```

It performs a frozen dependency sync, unit tests, Ruff, shell syntax checks, and
a redacted token-leak scan that includes local untracked files.

## License

[MIT](https://github.com/vulonviing/ccu-jupyter-client/blob/main/LICENSE)
