/* eslint-disable no-promise-executor-return */
import confetti from 'canvas-confetti';
import Slot from '@js/Slot';
import SoundEffects from '@js/SoundEffects';

// Initialize slot machine
(() => {
  const drawButton = document.getElementById('draw-button') as HTMLButtonElement | null;
  const fullscreenButton = document.getElementById('fullscreen-button') as HTMLButtonElement | null;
  const settingsButton = document.getElementById('settings-button') as HTMLButtonElement | null;
  const settingsWrapper = document.getElementById('settings') as HTMLDivElement | null;
  const settingsContent = document.getElementById('settings-panel') as HTMLDivElement | null;
  const settingsSaveButton = document.getElementById('settings-save') as HTMLButtonElement | null;
  const settingsCloseButton = document.getElementById('settings-close') as HTMLButtonElement | null;
  const historyButton = document.getElementById('history-button') as HTMLButtonElement | null;
  const historyWrapper = document.getElementById('history') as HTMLDivElement | null;
  const historyContent = document.getElementById('history-panel') as HTMLDivElement | null;
  const historyCloseButton = document.getElementById('history-close') as HTMLButtonElement | null;
  const historyListTextArea = document.getElementById('history-list') as HTMLTextAreaElement | null;
  const sunburstSvg = document.getElementById('sunburst') as HTMLImageElement | null;
  const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  const nameListTextArea = document.getElementById('name-list') as HTMLTextAreaElement | null;
  const luckyMoneyListTextArea = document.getElementById('lucky-money-list') as HTMLTextAreaElement | null;
  const currentPlayerElement = document.getElementById('current-player') as HTMLSpanElement | null;
  const removeNameFromListCheckbox = document.getElementById('remove-from-list') as HTMLInputElement | null;
  const enableSoundCheckbox = document.getElementById('enable-sound') as HTMLInputElement | null;

  // Graceful exit if necessary elements are not found
  if (!(
    drawButton
    && fullscreenButton
    && settingsButton
    && settingsWrapper
    && settingsContent
    && settingsSaveButton
    && settingsCloseButton
    && historyButton
    && historyWrapper
    && historyContent
    && historyCloseButton
    && historyListTextArea
    && sunburstSvg
    && confettiCanvas
    && nameListTextArea
    && luckyMoneyListTextArea
    && currentPlayerElement
    && removeNameFromListCheckbox
    && enableSoundCheckbox
  )) {
    console.error('One or more Element ID is invalid. This is possibly a bug.');
    return;
  }

  if (!(confettiCanvas instanceof HTMLCanvasElement)) {
    console.error('Confetti canvas is not an instance of Canvas. This is possibly a bug.');
    return;
  }

  const soundEffects = new SoundEffects();
  const MAX_REEL_ITEMS = 40;
  const CONFETTI_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
  let confettiAnimationId;

  /** Confeetti animation instance */
  const customConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  /** Triggers cconfeetti animation until animation is canceled */
  const confettiAnimation = () => {
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
    const confettiScale = Math.max(0.5, Math.min(1, windowWidth / 1100));

    customConfetti({
      particleCount: 1,
      gravity: 0.8,
      spread: 90,
      origin: { y: 0.6 },
      colors: [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]],
      scalar: confettiScale
    });

    confettiAnimationId = window.requestAnimationFrame(confettiAnimation);
  };

  /** Function to stop the winning animation */
  const stopWinningAnimation = () => {
    if (confettiAnimationId) {
      window.cancelAnimationFrame(confettiAnimationId);
    }
    sunburstSvg.style.display = 'none';
  };

  /**  Function to be trigger before spinning */
  const onSpinStart = () => {
    stopWinningAnimation();
    drawButton.disabled = true;
    settingsButton.disabled = true;
    soundEffects.spin((MAX_REEL_ITEMS - 1) / 10);
  };

  /**  Function to be trigger before spinning name */
  const onSpinNameStart = () => {
    stopWinningAnimation();
    drawButton.disabled = true;
    settingsButton.disabled = true;
    soundEffects.spinName(10000); // a very long time so we can stop it manually
  };

  /**  Function to be trigger after spinning name */
  const onSpinNameEnd = async () => {
    soundEffects.stop();
    soundEffects.spinNameSuccess(1);
    // sleep 1s
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  /**  Functions to be trigger after spinning */
  const onSpinEnd = async () => {
    confettiAnimation();
    sunburstSvg.style.display = 'block';
    await soundEffects.win();
    drawButton.disabled = false;
    settingsButton.disabled = false;
  };

  /** Slot instance */
  const slot = new Slot({
    reelContainerSelector: '#reel',
    maxReelItems: MAX_REEL_ITEMS,
    onSpinStart,
    onSpinEnd,
    onSpinNameStart,
    onSpinNameEnd,
    onNameListChanged: stopWinningAnimation
  });

  /** To open the setting page */
  const onSettingsOpen = () => {
    nameListTextArea.value = slot.names.length ? slot.names.join('\n') : '';
    luckyMoneyListTextArea.value = slot.luckyMoneys.length ? slot.luckyMoneys.join('\n') : '';
    removeNameFromListCheckbox.checked = slot.shouldRemoveWinnerFromNameList;
    enableSoundCheckbox.checked = !soundEffects.mute;
    settingsWrapper.style.display = 'block';
  };

  /** To close the setting page */
  const onSettingsClose = () => {
    settingsContent.scrollTop = 0;
    settingsWrapper.style.display = 'none';
  };

  /** To open the history page */
  const onHistoryOpen = () => {
    // Display from the latest draw
    historyListTextArea.value = slot.drawHistories.slice().reverse().join('\n');
    historyWrapper.style.display = 'block';
  };

  /** To close the history page */
  const onHistoryClose = () => {
    historyContent.scrollTop = 0;
    historyWrapper.style.display = 'none';
  };

  // Click handler for "Draw" button
  drawButton.addEventListener('click', async () => {
    if (!slot.names.length) {
      onSettingsOpen();
      return;
    }

    // await slot.beforeSpin(); // Update the current player name
    // // Random between slot.names before actually render the current player
    // for (let i = 0; i < slot.names.length * 6; i += 1) {
    //   currentPlayerElement.textContent =
    // `Selecting... ${slot.names[Math.floor(Math.random() * slot.names.length)]}`;
    //   // Slow down the animation each time
    //   await new Promise((resolve) => setTimeout(resolve, 20 * (i + 1)));
    // }
    // currentPlayerElement.textContent = `⭐️ ${slot.currentPlayerName} ⭐️`;

    // soundEffects.spin((MAX_REEL_ITEMS - 1) / 10);
    slot.spin();
  });

  // Hide fullscreen button when it is not supported
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - for older browsers support
  if (!(document.documentElement.requestFullscreen && document.exitFullscreen)) {
    fullscreenButton.remove();
  }

  // Click handler for "Fullscreen" button
  fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  // Click handler for "Settings" button
  settingsButton.addEventListener('click', onSettingsOpen);

  // Click handler for "History" button
  historyButton.addEventListener('click', onHistoryOpen);

  // Click handler for "Save" button for setting page
  settingsSaveButton.addEventListener('click', () => {
    slot.names = nameListTextArea.value
      ? nameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
      : [];
    slot.luckyMoneys = luckyMoneyListTextArea.value
      ? luckyMoneyListTextArea.value.split(/\n/).filter((luckyMoney) => Boolean(luckyMoney.trim()))
      : [];
    slot.shouldRemoveWinnerFromNameList = removeNameFromListCheckbox.checked;
    soundEffects.mute = !enableSoundCheckbox.checked;
    onSettingsClose();
  });

  // Click handler for "Discard and close" button for setting page
  settingsCloseButton.addEventListener('click', onSettingsClose);

  // Click handler for "Close" button for history page
  historyCloseButton.addEventListener('click', onHistoryClose);
})();
