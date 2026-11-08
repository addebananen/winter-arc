// Keep an unavailable upload from becoming a broken-image icon or a collapsed card.
export async function displayPhoto(image,getSource){
 const fallback=image.closest('.post-media')?.querySelector('.photo-fallback');
 const unavailable=()=>{if(!image.isConnected)return;image.alt='Bilden kunde inte laddas.';if(fallback){image.hidden=true;fallback.hidden=false;}};
 if(fallback){fallback.hidden=true;image.hidden=false;}
 image.onerror=unavailable;
 image.onload=()=>{if(fallback){fallback.hidden=true;image.hidden=false;}};
 try{const src=await getSource(image.dataset.photo);if(!image.isConnected)return;if(src)image.src=src;else unavailable();}catch{unavailable();}
}
