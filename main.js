class TotoGenerator extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'generator');

    const title = document.createElement('h1');
    title.textContent = 'Toto Number Generator';

    const numbersContainer = document.createElement('div');
    numbersContainer.setAttribute('class', 'numbers');

    const button = document.createElement('button');
    button.textContent = 'Generate Numbers';

    const style = document.createElement('style');
    style.textContent = `
      .generator {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding: 2rem;
        background-color: var(--surface-color);
        border-radius: 1rem;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2), 0 6px 6px rgba(0, 0, 0, 0.2);
      }

      h1 {
        font-size: 2.5rem;
        color: var(--primary-color);
        text-shadow: 0 0 10px var(--primary-color);
      }

      .numbers {
        display: flex;
        gap: 1rem;
      }

      .number {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 4rem;
        height: 4rem;
        font-size: 2rem;
        font-weight: bold;
        color: var(--text-color);
        background-color: var(--surface-color-2);
        border-radius: 50%;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      button {
        padding: 1rem 2rem;
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--text-color);
        background-color: var(--primary-color);
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        box-shadow: 0 0 15px var(--primary-color);
        transition: all 0.2s ease-in-out;
      }

      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 25px var(--primary-color);
      }
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
    wrapper.appendChild(title);
    wrapper.appendChild(numbersContainer);
    wrapper.appendChild(button);

    const generateNumbers = () => {
      const numbers = new Set();
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 49) + 1);
      }

      numbersContainer.innerHTML = '';
      for (const number of [...numbers].sort((a, b) => a - b)) {
        const numberEl = document.createElement('div');
        numberEl.setAttribute('class', 'number');
        numberEl.textContent = number;
        numbersContainer.appendChild(numberEl);
      }
    };

    button.addEventListener('click', generateNumbers);
    generateNumbers();
  }
}

customElements.define('toto-generator', TotoGenerator);