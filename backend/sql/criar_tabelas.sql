CREATE TABLE IF NOT EXISTS cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    senha TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funcionario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    senha TEXT NOT NULL,
    especialidade TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_servico TEXT NOT NULL,
    descricao TEXT,
    preco_base REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS os (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    id_servico INTEGER NOT NULL,
    id_funcionario INTEGER NOT NULL,
    preco_unitario REAL NOT NULL,
    data TEXT NOT NULL,
    local TEXT NOT NULL,
    descricao TEXT NOT NULL,

    FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (id_servico) REFERENCES servico(id),
    FOREIGN KEY (id_funcionario) REFERENCES funcionario(id)
);