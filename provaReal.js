// index.js (variante sem paginação)
require('dotenv').config();
const fs = require('fs');
const clintApi = require('@api/clint-api');

const API_TOKEN = process.env.API_TOKEN
const LIMITE = 1000;           // > 758

(async () => {
  try {
    const { data } = await clintApi.getContacts({
      limit: LIMITE.toString(),
      'api-token': API_TOKEN
      // Sem offset, sem page
    });

    const contatos = data.data || [];
    console.log(`Total retornado: ${contatos.length}`);

    // --- deduplicação dentro da única página --------------
    const ids = contatos.map(c => c.id);
    const duplicados = ids.filter((id, idx) => ids.indexOf(id) !== idx);

    // --- numeração sequencial p/ conferência ---------------
    contatos.forEach((c, i) => { c.contagem = i + 1; });

    fs.writeFileSync('contatos_sem_paginacao.json',
                     JSON.stringify(contatos, null, 2));
    fs.writeFileSync('ids_duplicados_sem_paginacao.json',
                     JSON.stringify([...new Set(duplicados)], null, 2));

    console.log(
      `Duplicados encontrados: ${duplicados.length}. ` +
      `Arquivos exportados com sucesso!`
    );
  } catch (err) {
    console.error('Falha na chamada única:', err.message || err);
  }
})();