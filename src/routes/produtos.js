import { Router } from 'express';
import {
    listarProdutos,
    detalharProduto,
    criarProduto,
    atualizarProduto,
    removerProduto
} from '../controllers/produtosController.js';

const router = Router();

router.get('/', listarProdutos);
router.get('/:id', detalharProduto);
router.post('/', criarProduto);
router.put('/:id', atualizarProduto);
router.delete('/:id', removerProduto);

export default router;
