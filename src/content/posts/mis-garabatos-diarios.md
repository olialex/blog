---
titulo: 'Mis Garabatos Diarios'
descripcion: 'Un lugar para guardar mi progreso general, dibujos que no suelo darle importancia, pero que merecen ser recordados.'
fecha: 2026-09-15
categoria: galeria
etiquetas: ['dibujo', 'experimentos', 'hábitos']
portada: ''
portadaAlt: 'mis garabatos'
noListado: true
---
<div class="list-gallery">
	<div class="posts-grid posts-grid-lista gallery-box">
		<a class="card-portada" href="https://google.com" target="_blank">
			<img class="card-portada-img" src="/src/assets/img/avatar.webp" alt="">
			<span>item 1</span>
		</a>
		<a class="card-portada" href="https://google.com" target="_blank">
			<img class="card-portada-img" src="/src/assets/img/avatar.webp" alt="">
			<span>item 1</span>
		</a>
		<a class="card-portada" href="https://google.com" target="_blank">
			<img class="card-portada-img" src="/src/assets/img/avatar.webp" alt="">
			<span>item 1</span>
		</a>
		<a class="card-portada" href="https://google.com" target="_blank">
			<img class="card-portada-img" src="/src/assets/img/avatar.webp" alt="">
			<span>item 1</span>
		</a>
	</div>
</div>

<style>
	.list-gallery{
		width: 100%;
	}

	.list-gallery .gallery-box a {
		position: relative;
		overflow: hidden;

		transition: all .25s ease;
	}

	.list-gallery .gallery-box a::after{
		content: ' ';
		background: linear-gradient(180deg,rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0.85) 100%);;

		position: absolute;

		inset: 0;
	}

	.list-gallery .gallery-box a img {
		aspect-ratio: 4/5;
		object-fit: cover;
		width: 100%;
		height: 100%;
		border-radius: 8px;
	}

	.list-gallery .gallery-box a span{
		position: absolute;
		bottom: 1rem;
		left: 1rem;

		z-index: 2;

		color: #fff;
	}
</style>