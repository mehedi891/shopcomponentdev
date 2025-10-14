const openCartDialogSpcFncInternal = (action) => {
  const dialog = document.querySelector('.spc_embedup_cart_dialog');
  console.log('dialog', dialog);
  if (!dialog) return;
  if (action === 'open') {
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  } else {
    dialog.close();
    document.body.style.overflow = 'auto';
  }
}

export {
  openCartDialogSpcFncInternal
}