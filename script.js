document.addEventListener('DOMContentLoaded', () => {
    // Chave da API e URLs base
    const CHAVE_API = '6e1ba9724016f9e04aa3f8684b315a3c'; //chave de API
    const URL_BASE = 'https://api.themoviedb.org/3';
    const URL_IMAGENS = 'https://image.tmdb.org/t/p/w500';
    const URL_POSTER_CARROSSEL = 'https://image.tmdb.org/t/p/original';

    // Elementos do DOM
    const contemFilmesLista = document.getElementById('movieList');
    const campoPesquisa = document.getElementById('searchInput');
    const filtroGenero = document.getElementById('genreFilter');
    const contemCarrossel = document.getElementById('carouselInner');
    const modalDetalhesFilme = new bootstrap.Modal(document.getElementById('movieDetailModal'));
    const tituloModalDetalhes = document.getElementById('movieDetailModalLabel');
    const corpoModalDetalhes = document.getElementById('movieDetailBody');

    let todosOsFilmes = []; // Armazena todos os filmes

    // Método para buscar e preencher os gêneros no filtro
    async function obterGeneros() {
        try {
            const resposta = await fetch(`${URL_BASE}/genre/movie/list?api_key=${CHAVE_API}&language=pt-BR`);
            const dados = await resposta.json();
            dados.genres.forEach(genero => {
                const opcao = document.createElement('option');
                opcao.value = genero.id;
                opcao.textContent = genero.name;
                filtroGenero.appendChild(opcao);
            });
        } catch (erro) {
            console.error('Erro ao carregar os gêneros:', erro);
        }
    }

    // Método para buscar os filmes que atualmente em cartaz
    async function obterFilmesEmCartaz() {
        try {
            const resposta = await fetch(`${URL_BASE}/movie/now_playing?api_key=${CHAVE_API}&language=pt-BR&page=1`);
            const dados = await resposta.json();
            todosOsFilmes = dados.results; // Guarda todos os filmes
            mostrarFilmes(todosOsFilmes); // Exibe inicialmente todos os filmes
        } catch (erro) {
            console.error('Erro ao buscar filmes em cartaz:', erro);
        }
    }

    // Método para buscar filmes populares para o carrossel de destaques
    async function obterFilmesPopulares() {
        try {
            const resposta = await fetch(`${URL_BASE}/movie/popular?api_key=${CHAVE_API}&language=pt-BR&page=1`);
            const dados = await resposta.json();
            exibirCarrosselFilmesPopulares(dados.results.slice(0, 5)); // Pega os 5 primeiros para o carrossel
        } catch (erro) {
            console.error('Erro ao carregar filmes populares para o carrossel:', erro);
        }
    }

    // Método para exibir filmes no carrossel
    function exibirCarrosselFilmesPopulares(filmes) {
        contemCarrossel.innerHTML = ''; // Limpa antes de adicionar
        filmes.forEach((filme, indice) => {
            const itemCarrossel = document.createElement('div');
            itemCarrossel.classList.add('carousel-item');
            if (indice === 0) {
                itemCarrossel.classList.add('active'); // Primeiro item ativo
            }

            const caminhoFundo = filme.backdrop_path ? URL_POSTER_CARROSSEL + filme.backdrop_path : 'https://via.placeholder.com/1200x600?text=Sem+Imagem+de+Fundo';
            const sinopse = filme.overview || 'Sinopse não disponível para este filme.';
            const tituloFilme = filme.title || 'Título Desconhecido';

            itemCarrossel.innerHTML = `
                <img src="${caminhoFundo}" class="d-block w-100" alt="${tituloFilme}">
                <div class="carousel-caption d-none d-md-block">
                    <h5>${tituloFilme}</h5>
                    <p>${sinopse}</p>
                </div>
            `;
            contemCarrossel.appendChild(itemCarrossel);
        });
    }

    // Método para exibir filmes na lista principal
    function mostrarFilmes(filmesParaExibir) {
        contemFilmesLista.innerHTML = ''; // Limpa a lista antes de mostrar novos filmes
        if (filmesParaExibir.length === 0) {
            contemFilmesLista.innerHTML = '<p class="text-white text-center w-100">Poxa, nenhum filme encontrado com esses critérios.</p>';
            return;
        }

        filmesParaExibir.forEach(filme => {
            const caminhoPoster = filme.poster_path ? URL_IMAGENS + filme.poster_path : 'https://via.placeholder.com/300x450?text=P%C3%B4ster+N%C3%A3o+Dispon%C3%ADvel';
            const titulo = filme.title || 'Título Não Informado';
            const mediaVotos = filme.vote_average ? filme.vote_average.toFixed(1) : 'S/N'; // Simplificado
            const dataLancamento = filme.release_date ? new Date(filme.release_date).toLocaleDateString('pt-BR') : 'Data Indisp.'; // Simplificado
            const sinopseCurta = filme.overview || 'Sem sinopse no momento.';

            const cardFilme = document.createElement('div');
            cardFilme.classList.add('col');
            cardFilme.innerHTML = `
                <div class="card movie-card h-100" data-movie-id="${filme.id}">
                    <img src="${caminhoPoster}" class="card-img-top" alt="Pôster de ${titulo}">
                    <div class="card-body">
                        <h5 class="card-title">${titulo}</h5>
                        <p class="card-text">
                            <i class="fas fa-star text-warning"></i> ${mediaVotos}
                            <span class="badge bg-secondary ms-2">${dataLancamento}</span>
                        </p>
                        <p class="card-text small-text d-none d-sm-block">${sinopseCurta.substring(0, 100)}...</p>
                    </div>
                </div>
            `;
            contemFilmesLista.appendChild(cardFilme);

            // Adiciona um "ouvinte de evento" para o clique no card do filme
            cardFilme.querySelector('.movie-card').addEventListener('click', () => {
                obterDetalhesFilme(filme.id); // Chama o método para buscar os detalhes
            });
        });
    }

    // Método para buscar detalhes de um filme específico para o modal
    async function obterDetalhesFilme(idFilme) {
        try {
            const respostaFilme = await fetch(`${URL_BASE}/movie/${idFilme}?api_key=${CHAVE_API}&language=pt-BR`);
            const dadosFilme = await respostaFilme.json();

            const respostaCreditos = await fetch(`${URL_BASE}/movie/${idFilme}/credits?api_key=${CHAVE_API}&language=pt-BR`);
            const dadosCreditos = await respostaCreditos.json();

            preencherModalDetalhes(dadosFilme, dadosCreditos);
        } catch (erro) {
            console.error('Problema ao carregar detalhes do filme:', erro);
            alert('Não foi possível carregar as informações detalhadas deste filme. Tente novamente mais tarde.');
        }
    }

    // Método para preencher e exibir o modal de detalhes do filme
    function preencherModalDetalhes(filme, creditos) {
        tituloModalDetalhes.textContent = filme.title || 'Detalhes do Filme';

        const caminhoPoster = filme.poster_path ? URL_IMAGENS + filme.poster_path : 'https://via.placeholder.com/300x450?text=Sem+P%C3%B4ster';
        const generos = filme.genres.map(g => g.name).join(', ') || 'Não especificado';
        const sinopseCompleta = filme.overview || 'Sinopse detalhada não disponível.';
        const mediaVotosDetalhes = filme.vote_average ? filme.vote_average.toFixed(1) : 'S/N';
        const duracao = filme.runtime ? `${filme.runtime} minutos` : 'Desconhecida';
        const dataLancamentoDetalhes = filme.release_date ? new Date(filme.release_date).toLocaleDateString('pt-BR') : 'Não informada';
        const diretor = creditos.crew.find(c => c.job === 'Director')?.name || 'Não listado';
        const elencoPrincipal = creditos.cast.slice(0, 5).map(a => a.name).join(', ') || 'Nenhum ator principal listado';

        corpoModalDetalhes.innerHTML = `
            <div class="row">
                <div class="col-md-4 text-center">
                    <img src="${caminhoPoster}" alt="${filme.title}" class="img-fluid rounded shadow mb-3">
                </div>
                <div class="col-md-8">
                    <p><strong>Sinopse:</strong> ${sinopseCompleta}</p>
                    <p><strong>Gêneros:</strong> ${generos}</p>
                    <p><strong>Avaliação:</strong> <i class="fas fa-star text-warning"></i> ${mediaVotosDetalhes} / 10</p>
                    <p><strong>Duração:</strong> ${duracao}</p>
                    <p><strong>Lançamento:</strong> ${dataLancamentoDetalhes}</p>
                    <p><strong>Direção:</strong> ${diretor}</p>
                    <p><strong>Elenco Principal:</strong> ${elencoPrincipal}</p>
                    <hr>
                    <h6 class="text-white-50">Sessões de Exibição (Exemplo - Informação não real):</h6>
                    <ul class="list-unstyled">
                        <li><span class="badge bg-info">14:00</span> Cinema da Cidade</li>
                        <li><span class="badge bg-info">17:00</span> Cine Mais</li>
                        <li><span class="badge bg-info">20:30</span> Grand Cinemas</li>
                    </ul>
                </div>
            </div>
        `;
        modalDetalhesFilme.show(); // Mostra o modal
    }

    // Método para a barra de pesquisa
    campoPesquisa.addEventListener('input', () => {
        const termoPesquisa = campoPesquisa.value.toLowerCase();
        const filmesFiltrados = todosOsFilmes.filter(filme =>
            filme.title.toLowerCase().includes(termoPesquisa)
        );
        mostrarFilmes(filmesFiltrados); // Exibe apenas os filmes que correspondem à pesquisa
    });

    // Método para o filtro de gênero
    filtroGenero.addEventListener('change', () => {
        const idGeneroSelecionado = parseInt(filtroGenero.value);
        if (idGeneroSelecionado) {
            const filmesFiltradosPorGenero = todosOsFilmes.filter(filme =>
                filme.genre_ids && filme.genre_ids.includes(idGeneroSelecionado)
            );
            mostrarFilmes(filmesFiltradosPorGenero);
        } else {
            mostrarFilmes(todosOsFilmes); // Se nenhum gênero for selecionado, mostra todos
        }
    });

    obterGeneros();
    obterFilmesEmCartaz();
    obterFilmesPopulares();
});