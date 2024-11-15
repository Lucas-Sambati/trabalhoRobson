const { Client } = require('pg');
const readline = require('readline');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '99712003', 
    database: 'trabalhoRobson'
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function exibirClientes() {
    const res = await client.query('SELECT id, saldo FROM clientes ORDER BY id asc');
    console.log('Tabela de Clientes:');
    console.log('ID\tSaldo');
    console.log('-------------------');
    res.rows.forEach(cliente => {
        console.log(`${cliente.id}\t${cliente.saldo}`);
    });
    console.log('-------------------\n');
}

async function atualizarSaldo() {
    try {
        await client.connect(); 

        await exibirClientes(); 

        rl.question('Digite o ID do cliente que você deseja selecionar: ', async (id_cliente) => {
            try {
                const res = await client.query('SELECT saldo FROM clientes WHERE id = $1 FOR UPDATE NOWAIT', [id_cliente]);

                if (res.rows.length === 0) {
                    console.log(`Cliente com ID ${id_cliente} não encontrado.`);
                    rl.close();
                    await client.end(); 
                    return;
                }

                console.log(`Saldo atual do cliente: ${res.rows[0].saldo}`);

                rl.question('Digite o novo saldo que você gostaria de atualizar: ', async (novo_saldo) => {
                    try {
                        await client.query('BEGIN');

                        await client.query('UPDATE clientes SET saldo = $1 WHERE id = $2', [novo_saldo, id_cliente]);

                        rl.question(`Você confirma a atualização do saldo para ${novo_saldo}? (s/n): `, async (confirmacao) => {
                            if (confirmacao.toLowerCase() === 's') {
                                await client.query('COMMIT');
                                console.log('Atualização confirmada e saldo atualizado com sucesso.');
                            } else {
                                await client.query('ROLLBACK');
                                console.log('Atualização cancelada e alterações revertidas.');
                            }

                            rl.close();
                            await client.end(); 
                        });
                    } catch (error) {
                        console.error('Erro ao atualizar saldo:', error);
                        await client.query('ROLLBACK');
                        rl.close();
                        await client.end();
                    }
                });
            } catch (error) {
                if (error.code === '55P03') {
                    console.log('O registro está sendo alterado por outro usuário, tente mais tarde!');
                } else {
                    console.error('Erro:', error);
                }
                await client.query('ROLLBACK');
                rl.close();
                await client.end();
            }
        });
    } catch (error) {
        console.error('Erro:', error);
        await client.query('ROLLBACK');
        rl.close();
        await client.end(); 
    }
}

atualizarSaldo();

