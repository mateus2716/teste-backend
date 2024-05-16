const userController = require('../src/controllers/userController');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock do modelo User e das bibliotecas bcrypt e jsonwebtoken
jest.mock('../src/models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('userController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar um novo usuário e retornar um token', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const hashedPassword = 'hashedpassword123';
    bcrypt.hash.mockResolvedValue(hashedPassword);
    User.create.mockResolvedValue({ ...req.body, password: hashedPassword });
    jwt.sign.mockReturnValue('mocked-jwt-token');

    await userController.createUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);
    expect(User.create).toHaveBeenCalledWith({ ...req.body, password: hashedPassword });
    expect(jwt.sign).toHaveBeenCalledWith({ id: expect.anything() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      user: { ...req.body, password: hashedPassword },
      token: 'mocked-jwt-token'
    });
  });

  test('deve retornar erro ao falhar na criação do usuário', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    User.create.mockRejectedValue(new Error('Erro ao criar usuário'));

    await userController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao criar usuário' });
  });
});
