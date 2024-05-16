const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  const { nome, email, senha, telefones } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ mensagem: 'E-mail já existente' });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    user = new User({
      nome,
      email,
      senha: hashedSenha,
      telefones,
      token
    });

    await user.save();

    res.status(201).json({
      id: user.id,
      data_criacao: user.data_criacao,
      data_atualizacao: user.data_atualizacao,
      ultimo_login: user.ultimo_login,
      token: user.token
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ mensagem: 'Erro no servidor' });
  }
};

const signin = async (req, res) => {
  const { email, senha } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ mensagem: 'Usuário e/ou senha inválidos' });
    }

    user.ultimo_login = Date.now();
    user.token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await user.save();

    res.status(200).json({
      id: user.id,
      data_criacao: user.data_criacao,
      data_atualizacao: user.data_atualizacao,
      ultimo_login: user.ultimo_login,
      token: user.token
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ mensagem: 'Erro no servidor' });
  }
};

const getUser = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user || user.token !== token) {
      return res.status(401).json({ mensagem: 'Não autorizado' });
    }

    const sessionAge = (Date.now() - new Date(user.ultimo_login)) / (1000 * 60);
    if (sessionAge > 30) {
      return res.status(401).json({ mensagem: 'Sessão inválida' });
    }

    res.status(200).json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      telefones: user.telefones,
      data_criacao: user.data_criacao,
      data_atualizacao: user.data_atualizacao,
      ultimo_login: user.ultimo_login
    });
  } catch (err) {
    console.error('Erro ao obter usuário:', err);
    res.status(401).json({ mensagem: 'Não autorizado' });
  }
};

module.exports = { signup, signin, getUser, createUser };
