const lightbox=document.querySelector('#lightbox');
const enlarged=lightbox.querySelector('img');
let opener;
document.querySelectorAll('.photo-button').forEach(button=>button.addEventListener('click',()=>{opener=button;enlarged.src=button.dataset.full;enlarged.alt=button.querySelector('img').alt;lightbox.showModal();document.body.style.overflow='hidden';}));
lightbox.querySelector('.close').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('click',event=>{if(event.target===lightbox){const r=lightbox.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)lightbox.close();}});
lightbox.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus();});
document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>{document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});}));
