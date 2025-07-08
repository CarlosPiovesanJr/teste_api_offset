# 🧪 Teste de Paginação - API Clint

Este repositório tem como objetivo testar e validar se a API da Clint está retornando contatos duplicados entre as páginas quando utilizada com parâmetros de paginação (`offset`, `limit` e `page`).

## 🚨 Problema identificado

Mesmo utilizando parâmetros corretos de paginação e recebendo o número total esperado de contatos, a resposta da API contém **contatos duplicados entre as páginas**. Este repositório realiza uma prova real para detectar e comprovar esse comportamento.

---

## ⚙️ Pré-requisitos

- Node.js v18 ou superior
- Token de acesso da API Clint (com permissão para leitura de contatos)

---

## 📦 Instalação

```bash
git clone https://github.com/sua-org/teste-api-offset.git
cd teste-api-offset
npm install
```

---

## 🔐 Configuração

Antes de rodar o teste, crie um arquivo `.env` na raiz do projeto com a seguinte variável:

```env
API_TOKEN=seu_token_da_clint_aqui
```

Você pode usar o arquivo `.env.example` como referência:

```bash
cp .env.example .env
```

---

## ▶️ Como executar o teste

Para executar o teste de paginação, use o comando abaixo:

```bash
node index.js
node provaReal.js
```

---

## 📁 Arquivos gerados

Após a execução, os seguintes arquivos serão criados para facilitar a análise:

| Arquivo                              | Descrição                                                                 |
|--------------------------------------|---------------------------------------------------------------------------|
| `contatos_completos.json`            | Lista completa de contatos paginados, com numeração de 1 a N             |
| `ids_duplicados.json`                | Lista com os IDs duplicados entre as páginas                             |
| `contatos_sem_paginacao.json`        | Lista única de todos os contatos obtidos com `limit` alto, sem offset    |
| `ids_duplicados_sem_paginacao.json`  | IDs duplicados mesmo sem paginação (esperado: zero)                      |

---

## ✅ Resultado esperado

- O número de contatos deve bater com o total da conta.
- O arquivo `ids_duplicados.json` deve estar vazio se a API estiver paginando corretamente.
- A comparação com o resultado de `contatos_sem_paginacao.json` ajuda a isolar se o problema está na paginação ou nos dados.