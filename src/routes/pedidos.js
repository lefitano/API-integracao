import { Router } from 'express';
import {
    listarPedidos,
    detalharPedido,
    criarPedido,
    atualizarPedido,
    removerPedido
} from '../controllers/pedidosController.js';

const router = Router();

router.get('/', listarPedidos);
router.get('/:id', detalharPedido);
router.post('/', criarPedido);
router.put('/:id', atualizarPedido);
router.delete('/:id', removerPedido);

export default router;
