describe('Проверка авторизации и профиля пользователя', () => {
  beforeEach(() => {
    cy.fixture('user.json').as('mockedUser');

    cy.intercept('GET', '**/api/auth/user', {fixture: 'user.json'}).as('getUser');
  });

  it('Открывает страницу профиля и отображает форму с именем пользователя', function () {
    cy.loginByApi();
    cy.visit('/');

    cy.contains('Личный кабинет').click();
    cy.wait('@getUser');

    cy.get('@mockedUser').then(({ user }) => {
      cy.contains(user.name, { timeout: 8000 }).click();
      cy.url().should('include', '/profile');
      cy.get('input[name="name"]').should('have.value', user.name);
    });
  });
});


describe('Конструктор: поведение и заказ', () => {
  beforeEach(() => {
    cy.fixture('ingredients.json').as('mockedIngredients');
    cy.fixture('user.json').as('mockedUser');

    cy.setCookie('accessToken', 'exampleToken');
    localStorage.setItem('refreshToken', 'exampleToken');

    cy.intercept('GET', '**/api/ingredients', {fixture: 'ingredients.json'}).as('ingredientsAPI');
    cy.intercept('GET', '**/api/auth/user', {fixture: 'user.json'}).as('userAPI');

    cy.visit('/');
    cy.wait('@ingredientsAPI');
    cy.contains('Соберите бургер').should('exist');
  });

  it('Пустой конструктор показывает подсказки', () => {
    cy.contains('Выберите булки').should('be.visible');
    cy.contains('Выберите начинку').should('be.visible');
  });

  it('Просмотр карточки ингредиента и закрытие по ESC', function () {
    cy.get('@mockedIngredients').then(({ data }) => {
      cy.contains(data.find((el) => el.type === 'bun').name).click();
      cy.url().should('include', '/ingredients/');
      cy.get('body').type('{esc}');
      cy.url().should('eq', 'http://localhost:4000/');
    });
  });

  it('Закрытие модального окна через клик вне', function () {
    cy.get('@mockedIngredients').then(({ data }) => {
      cy.contains(data.find((el) => el.type === 'bun').name).click();
      cy.contains('Детали ингредиента').should('be.visible');
      cy.get('body').click(5, 5);
      cy.url().should('eq', 'http://localhost:4000/');
    });
  });


  it('Оформление заказа', function () {
    cy.fixture('makeOrder.json').as('mockedOrder');
    cy.intercept('POST', '**/api/orders', {fixture: 'makeOrder.json', statusCode: 200,}).as('orderAPI');

    cy.get('@mockedIngredients').then(({ data }) => {
      cy.contains(data.find((item) => item.type === 'bun').name).parent().find('button').click();
      cy.contains(data.find((item) => item.type === 'main').name).parent().find('button').click();

      cy.contains('Оформить заказ').click();
      cy.wait('@orderAPI');

      cy.get('@mockedOrder').then((order) => {
        cy.contains(order.order.number.toString()).should('be.visible');
      });
    });
  });
});
