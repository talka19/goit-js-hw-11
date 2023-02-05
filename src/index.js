import './sass/index.scss';
import Notiflix from 'notiflix';
import SimpleLightbox from "simplelightbox";
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios';
import debounce from 'lodash.debounce';

const form = document.querySelector("#search-form");
const galleryEl = document.querySelector(".gallery");

let lightbox = new SimpleLightbox('.gallery a', {  
  captionsData: 'alt',
  captionDelay: 250,
  scrollZoom: false,
});


const lineParameters = {
    key:"33356007-e1ae8fd957b363ad4876a5fea",
    image_type:"photo",
    orientation: "horizontal",
    safesearch: "true",
};

const PER_PAGE = 40;

let img = undefined;
let page = 1;
let pagesLeft = 0;

async function getImg(img) {
   const response = await axios.get(
      `https://pixabay.com/api/?key=${lineParameters.key}&q=${img}&image_type=${lineParameters.image_type}&orientation=${lineParameters.orientation}&safesearch=${lineParameters.safesearch}&page=${page}&per_page=${PER_PAGE}`
    );
    console.log(response);
    return response.data;
}

form.addEventListener("submit", onSubmitForm);

async function onSubmitForm(e) {
   e.preventDefault();
   page = 1;
   img = e.currentTarget.elements.searchQuery.value.trim();
   galleryEl.innerHTML = '';
   
   if(img === "") {
     Notiflix.Notify.failure('Please, enter your search query.');
     return;
   }
   try{const response = await getImg(img);
    // console.log(response.hits)
    pagesLeft = response.totalHits;
    if(response.totalHits === 0) {
        Notiflix.Notify.failure("Sorry, there are no images matching your search query. Please try again.");
        return;
    } else{
        Notiflix.Notify.success(`Hooray! We found ${response.totalHits} images.`);

        galleryEl.insertAdjacentHTML(
            'beforeend',
            response.hits.map(picture => renderPicture(picture)).join('')
          );
          pagesLeft -= PER_PAGE;
        
          smoothScroll();
          window.addEventListener('scroll', checkPosition);
        };
        lightbox.refresh();
    } catch (error) {
      console.log(error);
    };
};

// async function loadMorehandler() {
  
//     page += 1;
//     if (pagesLeft <= 0) {
//       Notiflix.Notify.info(
//         "We're sorry, but you've reached the end of search results."
//       );
//       return;
//     } else {
//       try {
//         const response = await getImg(img);
//         galleryEl.insertAdjacentHTML(
//           'beforeend',
//           response.hits.map(picture => renderPicture(picture)).join('')
//         );
//         pagesLeft -= PER_PAGE;
//         lightbox.refresh();
//       } catch (error) {};
//     }
// }

function renderPicture(picture) {
    return `
    <div class="photo-card">
      <a href=${picture.largeImageURL}><div class="photo-img"><img src=${picture.webformatURL} alt=${picture.tags} loading="lazy" width="270" max-height="180"></div>
      <div class="info">
        <p class="info-item">
          <b>Likes: </b><span>${picture.likes}</span>
        </p>
        <p class="info-item">
          <b>Views: </b><span>${picture.views}</span>
        </p>
        <p class="info-item">
          <b>Comments: </b><span>${picture.comments}</span>
        </p>
        <p class="info-item">
          <b>Downloads: </b><span>${picture.downloads}</span>
        </p>
      </div></a>
    </div>
  `;
}


function smoothScroll() {
    const { height: cardHeight } = document
      .querySelector('.gallery')
      .firstElementChild.getBoundingClientRect();
    
    window.scrollBy({
      top: cardHeight * -1,
      behavior: 'smooth',
      
    });
};
  

async function infiniteScroll() {
    // Нам потребуется знать высоту документа и высоту экрана:
    const height = document.body.offsetHeight
    const screenHeight = window.innerHeight
  
    // Записываем, сколько пикселей пользователь уже проскроллил:
    const scrolled = window.scrollY
  
    // порог для визова функции:
    const threshold = height - screenHeight / 4
  
    // Отслеживаем, где находится низ экрана относительно страницы:
    const position = scrolled + screenHeight
  
    if (position <= threshold) {
            return;
    } else if (pagesLeft <= 0) {
        window.removeEventListener('scroll', checkPosition);
        Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
        return;
    } else {
        page += 1;
        const response = await getImg(img);
        galleryEl.insertAdjacentHTML(
            'beforeend',
            response.hits.map(picture => renderPicture(picture)).join('')
        );
        pagesLeft -= PER_PAGE;
        lightbox.refresh(); 
    };
}

const checkPosition = debounce(infiniteScroll, 300);