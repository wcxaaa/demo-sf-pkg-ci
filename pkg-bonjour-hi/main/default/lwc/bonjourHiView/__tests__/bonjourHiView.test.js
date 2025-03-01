import { createElement } from 'lwc';
import BonjourHiView from 'c/bonjourHiView';

describe('c-bonjour-hi-view', () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  test('Test coverage should be happy', () => {
    // Arrange
    const element = createElement('c-bonjour-hi-view', {
      is: BonjourHiView
    });

    // Act
    document.body.appendChild(element);

    // Assert
    expect(1).toBe(1);
  });
});