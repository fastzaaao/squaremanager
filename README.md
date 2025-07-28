# 🤖 SquareManager

Um bot Discord avançado para gerenciamento de aplicações na SquareCloud, com sistema de vendas automatizado, renovações e monitoramento completo.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Configuração Inicial](#configuração-inicial)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Comandos](#comandos)
- [API e Integrações](#api-e-integrações)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Suporte](#suporte)

## 🎯 Sobre o Projeto

O SquareManager é um bot Discord desenvolvido para automatizar e facilitar o gerenciamento de aplicações hospedadas na SquareCloud. Ele oferece um sistema completo de vendas, renovações automáticas, monitoramento de status e muito mais.

### Principais Características

- 🔧 **Gerenciamento Completo**: Controle total sobre suas aplicações SquareCloud
- 💰 **Sistema de Vendas**: Venda automatizada de hospedagens com múltiplas formas de pagamento
- 🔄 **Renovações Automáticas**: Sistema inteligente de renovação de aplicações
- 📊 **Monitoramento**: Acompanhamento em tempo real do status das aplicações
- 🎨 **Personalização**: Interface totalmente customizável
- 🔐 **Sistema de Permissões**: Controle granular de acesso às funcionalidades

## ✨ Funcionalidades

### 🛠️ Gerenciamento de Aplicações
- Ligar/desligar aplicações
- Reiniciar aplicações
- Monitorar logs em tempo real
- Transferir propriedade de aplicações
- Backup automático de dados

### 💳 Sistema de Pagamentos
- **PIX Semiautomático**: Integração com aprovação manual
- **MercadoPago**: Pagamentos automáticos via API
- Geração automática de QR codes
- Confirmação de pagamentos em tempo real

### 🔔 Notificações e Alertas
- Avisos de pré-expiração (configurável)
- Notificações de status das aplicações
- Alertas de pagamentos pendentes
- Logs detalhados de todas as ações

### 🎨 Personalização
- Customização de cores do bot
- Definição de status personalizados
- Upload de avatar e banner
- Mensagens personalizáveis

### 👥 Sistema de Permissões
- Controle de acesso por usuário
- Diferentes níveis de permissão
- Comandos administrativos protegidos

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 16.9.0 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Uma aplicação Discord criada no [Discord Developer Portal](https://discord.com/developers/applications)
- Conta na [SquareCloud](https://squarecloud.app/) com API key
- (Opcional) Conta no MercadoPago para pagamentos automáticos

## 🚀 Instalação

1. **Clone o repositório**
   \`\`\`bash
   git clone https://github.com/fastzaaao/squaremanager.git
   cd squaremanager
   \`\`\`

2. **Instale as dependências**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure as variáveis de ambiente**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. **Edite o arquivo .env com suas configurações**

5. **Criar arquivo de configuração obrigatório**
   - Navegue até a pasta `data/`
   - Crie um novo arquivo chamado `config.json`
   - Adicione apenas `{}` dentro do arquivo

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

\`\`\`env
# Discord Bot Configuration
DISCORD_TOKEN=seu_token_do_bot_discord
CLIENT_ID=id_da_aplicacao_discord
GUILD_ID=id_do_servidor_discord
OWNER_ID=seu_id_de_usuario_discord
\`\`\`

### Configuração do Bot Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação ou use uma existente
3. Vá para a seção "Bot" e copie o token
4. Na seção "OAuth2 > URL Generator":
   - Selecione "bot" e "applications.commands"
   - Selecione as permissões necessárias
   - Use a URL gerada para adicionar o bot ao seu servidor

### Permissões Necessárias

O bot precisa das seguintes permissões no Discord:
- Enviar mensagens
- Usar comandos de barra
- Gerenciar mensagens
- Adicionar reações
- Ver canais
- Mencionar todos

## 🔧 Configuração Inicial

### Arquivos Necessários

Antes de iniciar o bot, certifique-se de que existe o arquivo `data/config.json`:

### Primeira Execução

Após iniciar o bot pela primeira vez, é **essencial** realizar a configuração inicial através do comando `/painel`. Este comando abre o painel de administração onde você pode:

1. **Configurar a API da SquareCloud**
   - Definir sua API key da SquareCloud
   - Testar a conexão com a plataforma

2. **Configurar Formas de Pagamento**
   - PIX Semiautomático (chave PIX, aprovadores, tempo de expiração)
   - MercadoPago (access token, configurações automáticas)

3. **Definir Canais e Cargos**
   - Canal de logs
   - Canal de vendas
   - Cargos de cliente
   - Cargos administrativos

4. **Personalizar o Bot**
   - Cores do embed
   - Avatar e banner
   - Status personalizado
   - Nome do bot

### ⚠️ Importante
O bot **não funcionará corretamente** sem essa configuração inicial. Certifique-se de executar `/painel` logo após a primeira inicialização e configurar pelo menos:
- API key da SquareCloud
- Uma forma de pagamento
- Canais básicos (logs e vendas)

**IMPORTANTE**: O Git não adiciona pastas vazias por padrão. Se a pasta `data/` não existir ou estiver vazia, você deve:
1. Criar a pasta `data/` na raiz do projeto
2. Criar o arquivo `data/config.json` com o conteúdo `{}`
3. Este arquivo será preenchido automaticamente pelo bot na primeira execução

## 🎮 Uso

### Iniciando o Bot

\`\`\`bash
node index.js
\`\`\`

### ⚡ Configuração Obrigatória

**ATENÇÃO**: Após iniciar o bot pela primeira vez, execute imediatamente:

\`\`\`
/painel
\`\`\`

Este comando abrirá o painel de configuração onde você deve configurar:
1. ✅ API da SquareCloud
2. ✅ Formas de pagamento
3. ✅ Canais e cargos
4. ✅ Personalização básica

**O bot não funcionará sem essas configurações!**

### Comandos Principais

#### Comandos de Usuário
- `/apps` - Lista suas aplicações
- `/limpardm` - Limpa mensagens diretas do bot

#### Comandos Administrativos
- `/painel` - Abre o painel de configuração
- `/config-apps` - Criar, excluir e listar produtos | Gerenciar aplicações manualmente | Excluir aplicação manualmente
- `/manage-apps` - Editar produtos existentes
- `/enviar-msg` - Envia painel de compra de um produto
- `/renovar` - Renova aplicações manualmente

### Interface de Botões

O bot utiliza uma interface rica com botões interativos para:
- Gerenciar aplicações (ligar/desligar/reiniciar)
- Processar pagamentos
- Configurar o bot
- Gerenciar permissões

## 📁 Estrutura do Projeto

\`\`\`
squaremanager/
├── commands/                 # Comandos do bot
│   ├── admin/               # Comandos administrativos
│   └── user/                # Comandos de usuário
├── config/                  # Arquivos de configuração
├── data/                    # Dados em JSON
│   ├── applications.json    # Dados das aplicações
│   ├── config.json         # Configurações gerais
│   └── permissoes.json     # Sistema de permissões
├── events/                  # Eventos do Discord
├── interactions/            # Interações (botões, modais, etc.)
│   ├── buttons/            # Manipuladores de botões
│   ├── modals/             # Manipuladores de modais
│   └── selectMenus/        # Menus de seleção
├── jobs/                    # Tarefas agendadas
├── utils/                   # Utilitários e helpers
├── index.js                 # Arquivo principal
└── package.json            # Dependências do projeto
\`\`\`

## 🔧 API e Integrações

### SquareCloud API
O bot integra com a API da SquareCloud para:
- Gerenciar aplicações
- Obter status e logs
- Controlar recursos

### MercadoPago API
Para pagamentos automáticos:
- Criação de pagamentos PIX
- Webhook para confirmações
- Geração de QR codes

### Sistema de Webhooks
O bot pode receber webhooks para:
- Confirmações de pagamento
- Atualizações de status
- Notificações externas

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/SuaFeature`)
3. Commit suas mudanças (`git commit -m 'Add some SuaFeature'`)
4. Push para a branch (`git push origin feature/SuaFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição

- Mantenha o código limpo e bem documentado
- Siga os padrões de código existentes
- Teste suas mudanças antes de enviar
- Atualize a documentação quando necessário

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique as [Issues](https://github.com/fastzaaao/squaremanager/issues) existentes
2. Crie uma nova issue se necessário
3. Entre em contato através do Discord: `conflitar`

## 📊 Status do Projeto

- ✅ Sistema de gerenciamento de aplicações
- ✅ Integração com SquareCloud
- ✅ Sistema de pagamentos
- ✅ Interface de usuário completa
- ✅ Sistema de permissões
- 🔄 Melhorias contínuas

## 💻 Serviços utilizados

- [Discord.js](https://discord.js.org/) - Biblioteca para Discord
- [SquareCloud](https://squarecloud.app/) - Plataforma de hospedagem
- [MercadoPago](https://www.mercadopago.com.br/) - Gateway de pagamento

---

**Desenvolvido com 💗 por Fast**