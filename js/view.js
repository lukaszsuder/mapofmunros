export const printerFromView = 'View.JS';

const wyswietlCos = document.querySelector('.heading-primary-main');
const logoBox = document.querySelector('.logo-box');

export const printed = function (textToPrint) {
  wyswietlCos.textContent = textToPrint;
};

export const zmienObrazek = function (obrazek) {
  const markup = `
  <img src="img/${obrazek}" alt="Logo" class="logo" />
 `;

  logoBox.innerHTML = markup;
  console.log('Tu zmieniam logo');
  logoBox.classList.add('white');
};
