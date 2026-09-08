import { Router } from 'express';
import {
    listarClientes,
    detalharCliente,
    listarPedidosDoCliente,
    criarCliente,
    atualizarCliente,
    removerCliente
} from '../controllers/clientesController.js';

const router = Router();

router.get('/', listarClientes);
router.get('/:id', detalharCliente);
router.get('/:id/pedidos', listarPedidosDoCliente);
router.post('/', criarCliente);
router.put('/:id', atualizarCliente);
router.delete('/:id', removerCliente);

export default router;
