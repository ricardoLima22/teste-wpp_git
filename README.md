# Teste de envio WhatsApp (autodidata)

Este repositório contém um exemplo simples para enviar um arquivo via WhatsApp usando `whatsapp-web.js` (Node) com orquestração a partir de um script Python. O objetivo deste README é ser totalmente autodidata: passos claros, comandos práticos e soluções para problemas comuns.

**Arquivos principais**
- `package.json`: dependências Node (veja seção Dependências).
- [whatsapp_auth.js](whatsapp_auth.js): script para autenticar e salvar sessão no MongoDB.
- [whatsapp_sender.js](whatsapp_sender.js): script que envia o arquivo para um contato/grupo.
- [main.py](main.py): exemplo Python que lê um arquivo em `docs/` e invoca `whatsapp_sender.js`.

**Requisitos**
- Node.js (versão 16+ recomendada) e `npm`.
- Python 3.8+ com `pip`.
- Uma instância MongoDB acessível (local ou Atlas). Precisamos de uma URI para armazenar sessões.
- Navegador Chrome/Chromium instalado (o puppeteer usa o Chrome local quando disponível).

Instalação rápida
1. Abra um terminal na pasta do projeto.
2. Instale dependências Node:

```powershell
npm install
```

3. (Opcional) Crie e ative um virtualenv Python e instale `pandas`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # PowerShell
pip install pandas
```

Configurar a conexão ao MongoDB
1. Obtenha sua URI MongoDB (por exemplo, `mongodb+srv://user:pass@cluster0.mongodb.net/mydb`).
2. No Windows PowerShell (sessão atual):

```powershell
# $env:MONGODB_URI é somente para a sessão atual
$env:MONGODB_URI = "sua_mongodb_uri_aqui"
```

Para definir permanentemente (substitua o valor):

```powershell
setx MONGODB_URI "sua_mongodb_uri_aqui"
# Depois feche e reabra o terminal para herdar a variável
```

No Linux/macOS (bash):

```bash
export MONGODB_URI="sua_mongodb_uri_aqui"
```

Autenticar o WhatsApp (scan QR)
1. Execute o script de autenticação:

```powershell
node whatsapp_auth.js
```

2. O script vai imprimir um QR na forma de arte ASCII no terminal e também um link de imagem (usando o `api.qrserver.com`) que você pode abrir no navegador. Escaneie com o app do WhatsApp (telefone).
3. Aguarde as mensagens de `Remote session saved to DB!` e `Client is ready!`. Quando o processo confirmar que a sessão foi salva, o script fechará sozinho.

Enviar um arquivo (fluxo recomendado — Python)
1. Ajuste o arquivo que o `main.py` envia. Por padrão ele usa:

- `docs/RS_Registros_de_ponto_(19.01.2026).xlsx`

2. Abra `main.py` e atualize `recipient_name` com o nome do contato ou do grupo exatamente como aparece no WhatsApp (ex.: `REGISTRO DE PONTO`).
3. Execute:

```powershell
python main.py
# ou, se tiver múltiplas versões do python:
py -3 main.py
```

Observações: o `main.py` faz duas coisas: lê o Excel com `pandas` e chama internamente `node whatsapp_sender.js <recipient> <caption> <file_path>`.

Enviar um arquivo diretamente (Node)

```powershell
node whatsapp_sender.js "NOME_DO_CONTATO_OU_ID" "Texto opcional" "C:\caminho\para\seu\arquivo.xlsx"
```

Como indicar o destinatário
- Nome do grupo/contato exatamente como aparece no WhatsApp (maiúsculas/minúsculas normalmente não sensíveis, mas escreva igual para garantir).
- Alternativa: usar o `id._serialized` do chat (casos avançados). Se o chat não for encontrado, o script imprime as 10 primeiras conversas.

Dependências (referência)
- NPM (já listadas em `package.json`): `whatsapp-web.js`, `wwebjs-mongo`, `mongoose`, `qrcode-terminal`.
- Python: `pandas`.

Comandos resumidos (PowerShell)

```powershell
# 1) instalar dependências Node
npm install

# 2) definir MONGODB_URI (exemplo temporário)
$env:MONGODB_URI = "mongodb+srv://user:pass@cluster0.mongodb.net/mydb"

# 3) autenticar (rodar e escanear QR)
node whatsapp_auth.js

# 4) teste de envio via Python
python main.py
```

Erros comuns e soluções rápidas
- "Error: MONGODB_URI environment variable is not set.": defina a variável `MONGODB_URI` conforme mostrado acima.
- QR aparece repetidamente / sessão inválida: execute `node whatsapp_auth.js` localmente, escaneie o QR e aguarde a mensagem de sessão salva.
- `Chat 'X' not found.`: verifique o nome exato do contato ou grupo. Tente executar `node whatsapp_sender.js "NOME" "" "C:\arquivo.xlsx"` e veja a lista de chats sugerida pelo script.
- `File not found`: confira o caminho absoluto do arquivo; o `main.py` passa o caminho absoluto para o Node.
- Erros do Puppeteer/Chrome: verifique se o Chrome/Chromium está instalado. Em Linux pode ser necessário ajustar `CHROME_PATH`.

Dicas finais (autodidata)
- Se algo falhar, leia os logs no terminal: `dumpio: true` já está habilitado nos scripts para mostrar saída do Chrome, o que ajuda a debug.
- Para desenvolvimento iterativo, rode `node whatsapp_sender.js` manualmente com um arquivo pequeno (ex.: um .txt) antes de testar arquivos grandes.
- Guarde a `MONGODB_URI` com segurança. Se usar Atlas, crie um usuário limitado ao banco usado pelo projeto.

Se quiser, eu posso:
- Adicionar um `requirements.txt` com `pandas` e um pequeno `setup.md` para criar o ambiente Python automaticamente.
- Criar um script PowerShell `run.ps1` que automatize a sequência (definir URI, autenticar, enviar).

Boa sorte! Se quiser que eu gere o `requirements.txt` ou o script PowerShell, diga qual opção prefere.

**Uso com GitHub Actions (autenticação via QR na nuvem)**

Este projeto já contém dois workflows prontos em `.github/workflows`:
- `Authenticate WhatsApp` (arquivo: `.github/workflows/authenticate.yml`) — executa `node whatsapp_auth.js` e imprime o QR no log; usado apenas para escanear o QR e salvar a sessão no MongoDB.
- `WhatsApp Automation` (arquivo: `.github/workflows/whatsapp-automation.yml`) — roda periodicamente (cron) ou manualmente e executa `python main.py` para enviar o arquivo.

Passo a passo (GitHub Actions)
1. Na página do repositório no GitHub, vá em `Settings` → `Secrets and variables` → `Actions` e adicione o secret `MONGODB_URI` contendo sua connection string do MongoDB Atlas.
2. Abra a aba `Actions`, escolha o workflow **Authenticate WhatsApp** e clique em **Run workflow** (ou dispare via `workflow_dispatch`).
3. Abra a execução do workflow e veja os logs. O `whatsapp_auth.js` imprime um link de QR code no formato:

	 https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=<QR_STRING>

	 Clique nesse link (ou copie e abra no navegador) para exibir o QR e escaneie com o app do WhatsApp do seu celular.
4. Aguarde nos logs pelas mensagens `Remote session saved to DB!` e `Client is ready!`. Quando aparecerem, a sessão foi salva no MongoDB e ficará disponível para os runners do workflow de automação.

Observações importantes sobre o QR em Actions
- O QR aparece nos logs do workflow — em repositórios públicos os logs podem ser visíveis; proteja o acesso ao repositório e ao MongoDB.
- Para o GitHub Actions conseguir conectar ao Atlas, você precisa liberar a rede (Network Access) do Atlas para os IPs dos runners. Como os IPs do Actions mudam, a forma prática (embora menos restrita) é adicionar 0.0.0.0/0 temporariamente. Considere rotacionar credenciais e usar um usuário com permissões limitadas.

Configurar MongoDB Atlas (passos mínimos)
1. Crie uma conta em https://www.mongodb.com/cloud/atlas e crie um cluster gratuito.
2. Em Database Access → Create a Database User, crie um usuário com senha (anote a senha).
3. Em Network Access → Add IP Address, adicione `0.0.0.0/0` para permitir conexões do GitHub Actions (alternativa segura: adicionar IPs estáticos ou usar um proxy/VPN).
4. Em Clusters → Connect → Connect your application, copie a connection string no formato:

	 mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/<dbname>?retryWrites=true&w=majority

	 Substitua `<username>`, `<password>` e `<dbname>` conforme criado.
5. No GitHub, crie o secret `MONGODB_URI` com essa string completa.

O que modificar para produção
- `main.py`: atualize a variável `recipient_name` com o nome exato do contato/grupo e `file_to_send` para o arquivo desejado. O script chama o Node passando o caminho absoluto do arquivo.
- `whatsapp_auth.js` e `whatsapp_sender.js`: ambos dependem da variável de ambiente `MONGODB_URI`. Se precisar usar um Chrome/Chromium custom, defina também o secret `CHROME_PATH` e ajuste o workflow para exportar `CHROME_PATH`.
- `.github/workflows/whatsapp-automation.yml`: ajuste o `cron` se quiser outro agendamento ou deixe apenas `workflow_dispatch` para execuções manuais.

Explicação das funções em `*.js`
- `whatsapp_auth.js`:
	- Conecta ao MongoDB usando `MONGODB_URI` e `wwebjs-mongo` para salvar sessões remotas (`RemoteAuth`).
	- Inicializa o cliente `whatsapp-web.js` em modo headless e imprime o QR (ASCII + link de imagem).
	- Quando a sessão é salva (`remote_session_saved`) e o cliente fica pronto (`ready`), o script fecha. Use este script sempre que precisar gerar/atualizar a sessão que fica no MongoDB.

- `whatsapp_sender.js`:
	- Conecta ao MongoDB para restaurar a sessão salva.
	- Recebe argumentos: `recipient_name`, `caption`, `file_path`.
	- Procura o chat pelo `name` ou `id._serialized`. Faz um "warm-up" enviando `sendStateTyping()` para garantir troca de chaves E2E e evitar erros "Waiting for message".
	- Envia o arquivo (`MessageMedia.fromFilePath`) com legenda e espera 30s antes de encerrar para assegurar sincronização/entrega.

Fluxo recomendado para deploy em produção
1. Configure o MongoDB Atlas e crie o secret `MONGODB_URI` no GitHub.
2. Rode o workflow **Authenticate WhatsApp** no GitHub e escaneie o QR a partir do link de log.
3. Após confirmação nos logs de que a sessão foi salva, dispare (ou aguarde) o workflow **WhatsApp Automation** que usa a mesma `MONGODB_URI` para recuperar a sessão e enviar arquivos.

Boas práticas e segurança
- Não deixe `0.0.0.0/0` permanentemente em Network Access; isso é apenas para facilitar a integração com runners públicos. Em produção, prefira uma arquitetura que ofereça IPs fixos ou rede privada.
- Use um usuário MongoDB com permissões mínimas (apenas o banco necessário) e rotacione a senha se suspeitar de exposição.
- Mantenha o repositório privado se não quiser que o QR fique visível a terceiros.

Se quiser, eu posso:
- Gerar automaticamente as instruções para criar o secret no GitHub (com screenshots em texto) e adicionar um `run-auth.yml` de exemplo com mais logs.
- Criar um `requirements.txt` e um `run.ps1` para automatizar localmente.

Arquivo atualizado: [README.md](README.md)
