-- Consulta Especifica de Algum Dado

SELECT
cliente.nome AS 'Nome Cliente',
servico.nome_servico AS 'Serviço Solicitado',
os.preco_unitario AS 'Valor Total',
funcionario.id AS 'Id Funcionário',
funcionario.nome AS 'Nome Funcionário'
FROM os
INNER JOIN cliente ON os.id_cliente = cliente.id
INNER JOIN servico ON os.id_servico = servico.id
INNER JOIN funcionario ON os.id_funcionario = funcionario.id
WHERE cliente.cpf = '167.869.259-01';

-- Consulta Especifica de Tabelas Distintas

SELECT
    cliente.nome AS 'Nome Cliente',
    servico.nome_servico AS 'Seviço Solicitado',
    os.preco_unitario AS 'Valor Total',
    funcionario.id AS 'Id Funcionário',
    funcionario.nome AS 'Nome Funcionário'
FROM os
inner JOIN cliente ON os.id_cliente = cliente.id
inner JOIN servico ON os.id_servico = servico.id
inner JOIN funcionario ON os.id_funcionario = funcionario.id;

-- Consulta de Acordo Com a Letra

SELECT
    cliente.nome AS 'Nome Cliente',
    servico.nome_servico AS 'Serviço Solicitado',
    os.preco_unitario AS 'Valor Total',
    funcionario.id AS 'Id Funcionário',
    funcionario.nome AS 'Nome Funcionário'
FROM os
INNER JOIN cliente ON os.id_cliente = cliente.id
INNER JOIN servico ON os.id_servico = servico.id
INNER JOIN funcionario ON os.id_funcionario = funcionario.id
WHERE cliente.nome LIKE ? || '%' COLLATE NOCASE;