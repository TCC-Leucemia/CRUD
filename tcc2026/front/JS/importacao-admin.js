async function importarCadastroAdmin(tipo, origem, recarregar) {
  const arquivo = origem?.files?.[0] || origem;
  if (!arquivo) return;
  const extensao = arquivo.name.toLowerCase().slice(arquivo.name.lastIndexOf('.'));
  if (!['.csv', '.xml', '.pdf'].includes(extensao)) { HematoAI.showToast('Use um arquivo CSV, XML ou PDF.', 'error'); if (origem?.value !== undefined) origem.value = ''; return; }
  const dados = new FormData(); dados.append('arquivo', arquivo);
  try {
    HematoAI.showToast('Lendo e validando o arquivo...', 'info');
    const resposta = await fetch(`${API_URL}/admin/importar/${tipo}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, body: dados });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(corpo.msg || (corpo.details?.erros || []).join(' ') || 'Não foi possível importar o arquivo.');
    HematoAI.showToast(`${corpo.total} cadastro(s) importado(s) com sucesso.`, 'success');
    if (recarregar) await recarregar();
  } catch (erro) { HematoAI.showToast(erro.message, 'error'); }
  finally { if (origem?.value !== undefined) origem.value = ''; }
}
window.importarCadastroAdmin = importarCadastroAdmin;
