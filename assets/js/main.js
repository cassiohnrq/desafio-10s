  const cronometro = document.querySelector('#cronometro');
  const premio = document.querySelector('#premio');
  const barra = document.querySelector('#barra');
  const carregamento = document.querySelector('#carregamento');
  const info = document.querySelector('.info');
  const cadastroForm = document.querySelector('#cadastro');
  const rankingList = document.querySelector('#ranking ol');
  const btnBaixar = document.querySelector('#baixarCSV');
  const iniciarBtn = document.querySelector('#iniciarJogo');

  let nomeUsuario = '';
  let telefoneUsuario = '';
  let clienteTipo = '';
  let contando = false;
  let tempoInicial;
  let tempoDecorrido = 0;
  let idContagem;
  let terminouRodada = false;
  let jogadores = JSON.parse(localStorage.getItem('ranking')) || [];

  // === EVENTO TECLA ESPAÇO ===
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();

      // Se o cronômetro está rodando, para
      if (contando) {
        pausarCronometro();
        return;
      }

      // Se terminou rodada, pede novo cadastro
      if (terminouRodada || !nomeUsuario) {
        mostrarCadastro();
        return;
      }

      // Se tudo certo, inicia
      iniciarComCarregamento();
    }
  });

  // === BOTÃO CADASTRO ===
  iniciarBtn.addEventListener('click', () => {
    const nome = document.querySelector('#nome').value.trim();
    const telefone = document.querySelector('#telefone').value.trim();
    const cliente = document.querySelector('#cliente').value;
    if (!nome || !telefone || !cliente) {
      alert('Por favor, preencha nome, telefone e tipo de cliente!');
      return;
    }
    nomeUsuario = nome;
    telefoneUsuario = telefone;
    clienteTipo = cliente;
    cadastroForm.style.display = 'none';
    info.textContent = 'Preparando...';
    iniciarComCarregamento();
  });

  // === MOSTRAR CADASTRO ===
  function mostrarCadastro() {
    nomeUsuario = '';
    telefoneUsuario = '';
    document.querySelector('#nome').value = '';
    document.querySelector('#telefone').value = '';
    document.querySelector('#cliente').value = '';
    cadastroForm.style.display = 'flex';
    info.textContent = 'Digite nome e telefone para a próxima tentativa';
  }

  let contextoAudio; // contexto global para não recriar a cada bip
let carregandoSom = false; // evita sons sobrepostos

// === BARRA DE CARREGAMENTO COM BIP PROGRESSIVO E REINÍCIO ===
function iniciarComCarregamento() {
  // 🔁 Reinicia áudio e status
  if (contextoAudio) contextoAudio.close();
  contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
  carregandoSom = true;

  info.textContent = 'Preparando...';
  carregamento.style.display = 'block';
  barra.style.width = '0%';
  let progresso = 0;

  // Bips mais lentos → um a cada 200ms (ao invés de 100ms)
  const carregar = setInterval(() => {
    progresso++;
    barra.style.width = `${(progresso / 30) * 100}%`;

    // Bips progressivos: mais espaçados e suaves
    if (progresso % 6 === 0 && progresso <= 30) tocarBip(250 + progresso * 15, 0.08, 0.05);

    if (progresso >= 30) {
      clearInterval(carregar);
      carregamento.style.display = 'none';
      info.textContent = 'Cronômetro rodando...';
      carregandoSom = false;

      // 🔊 BIP FINAL especial (somente após o carregamento completo)
      setTimeout(() => {
        tocarBip(1000, 0.4, 0.12);
      }, 150);

      iniciarCronometro();
    }
  }, 200); // ← intervalo maior (200ms entre bips)
}

// === FUNÇÃO DE BIP ===
function tocarBip(frequencia = 888, duracao = 0.1, volume = 0.05) {
  if (!contextoAudio || !carregandoSom) return; // evita tocar fora do carregamento
  try {
    const oscilador = contextoAudio.createOscillator();
    const ganho = contextoAudio.createGain();

    oscilador.type = 'sine';
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(volume, contextoAudio.currentTime);

    oscilador.connect(ganho);
    ganho.connect(contextoAudio.destination);

    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + duracao);
  } catch (e) {
    console.warn("Som não suportado neste navegador:", e);
  }
}



  // === INICIAR CRONÔMETRO ===
  function iniciarCronometro() {
    contando = true;
    terminouRodada = false;
    tempoDecorrido = 0;
    tempoInicial = Date.now();
    idContagem = setInterval(mostraCronometro, 1);
  }

  // === ATUALIZAR VISUAL ===
  function mostraCronometro() {
    const agora = Date.now();
    const tempoTotal = agora - tempoInicial + tempoDecorrido;
    let ms = tempoTotal % 1000;
    let seg = Math.floor((tempoTotal / 1000) % 60);
    cronometro.textContent = `${seg.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  // === PAUSAR CRONÔMETRO ===
  function pausarCronometro() {
    if (!contando) return;
    clearInterval(idContagem);
    tempoDecorrido += Date.now() - tempoInicial;
    contando = false;
    terminouRodada = true;

    const segundos = tempoDecorrido / 1000;
    const diferenca = segundos - 10.000;

    if (Math.abs(diferenca) < 0.001) {
      premio.style.display = 'block';
      info.textContent = '🎉 Parabéns! Tempo exato!';
    } else {
      premio.style.display = 'none';
      info.textContent = `⏸ Você parou em ${segundos.toFixed(3)}s — pressione espaço para novo jogador.`;
    }

    jogadores.push({ nome: nomeUsuario, telefone: telefoneUsuario, cliente: clienteTipo, tempo: segundos, diferenca });
    localStorage.setItem('ranking', JSON.stringify(jogadores));
    atualizarRanking();
  }

  // === RANKING ===
  function atualizarRanking() {
    rankingList.innerHTML = '';
    const ordenado = [...jogadores].sort((a, b) => Math.abs(a.diferenca) - Math.abs(b.diferenca));
    ordenado.slice(0, 10).forEach((jogador, i) => {
      const li = document.createElement('li');
      li.innerHTML = `${i + 1}. ${jogador.nome}<br><span style="color: ##274B66; display: block;">${jogador.tempo.toFixed(3)}s</span>`;
      rankingList.appendChild(li);
    });
  }

  // === EXPORTAR CSV ===
  function salvarCSV() {
    let csv = "Nome,Telefone,Cliente,Tempo (s),Diferença\n";
    jogadores.forEach(j => {
      csv += `${j.nome},${j.telefone},${j.cliente},${j.tempo.toFixed(3)},${j.diferenca.toFixed(3)}\n`;
    });
    // Adiciona o BOM (\ufeff) no início da string CSV
    const csvWithBOM = '\ufeff' + csv;
    // Remove o charset do tipo MIME, pois o BOM já indica o UTF-8
    const blob=new Blob([csvWithBOM],{type:'text/csv; charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "cadastros_desafio.csv";
    a.click();
  }

  btnBaixar.addEventListener('click', salvarCSV);
  atualizarRanking();