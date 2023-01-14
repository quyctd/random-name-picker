interface SlotConfigurations {
  /** User configuration for maximum item inside a reel */
  maxReelItems?: number;
  /** User configuration for whether winner should be removed from name list */
  removeWinner?: boolean;
  /** User configuration for element selector which reel items should append to */
  reelContainerSelector: string;
  /** User configuration for callback function that runs before spinning reel */
  onSpinStart?: () => void;
  /** User configuration for callback function that runs after spinning reel */
  onSpinEnd?: () => void;

  /** User configuration for callback function that runs after user updates the name list */
  onNameListChanged?: () => void;
}

/** Class for doing random name pick and animation */
export default class Slot {
  /** List of names to draw from */
  private nameList: string[];

  /** Current player */
  private currentPlayer: string;

  /** List of lucky money to draw from */
  private luckyMoneyList: string[];

  /** List of draw history */
  private drawHistory: string[];

  /** Whether there is a previous winner element displayed in reel */
  private havePreviousWinner: boolean;

  /** Container that hold the reel items */
  private reelContainer: HTMLElement | null;

  /** Maximum item inside a reel */
  private maxReelItems: NonNullable<SlotConfigurations['maxReelItems']>;

  /** Whether winner should be removed from name list */
  private shouldRemoveWinner: NonNullable<SlotConfigurations['removeWinner']>;

  /** Reel animation object instance */
  private reelAnimation?: Animation;

  /** Callback function that runs before spinning reel */
  private onSpinStart?: NonNullable<SlotConfigurations['onSpinStart']>;

  /** Callback function that runs after spinning reel */
  private onSpinEnd?: NonNullable<SlotConfigurations['onSpinEnd']>;

  /** Callback function that runs after spinning reel */
  private onNameListChanged?: NonNullable<SlotConfigurations['onNameListChanged']>;

  /**
   * Constructor of Slot
   * @param maxReelItems  Maximum item inside a reel
   * @param removeWinner  Whether winner should be removed from name list
   * @param reelContainerSelector  The element ID of reel items to be appended
   * @param onSpinStart  Callback function that runs before spinning reel
   * @param onNameListChanged  Callback function that runs when user updates the name list
   */
  constructor(
    {
      maxReelItems = 30,
      removeWinner = true,
      reelContainerSelector,
      onSpinStart,
      onSpinEnd,
      onNameListChanged
    }: SlotConfigurations
  ) {
    this.nameList = [];
    this.currentPlayer = '';
    this.luckyMoneyList = [];
    this.drawHistory = [];
    this.havePreviousWinner = false;
    this.reelContainer = document.querySelector(reelContainerSelector);
    this.maxReelItems = maxReelItems;
    this.shouldRemoveWinner = removeWinner;
    this.onSpinStart = onSpinStart;
    this.onSpinEnd = onSpinEnd;
    this.onNameListChanged = onNameListChanged;

    // Create reel animation
    this.reelAnimation = this.reelContainer?.animate(
      [
        { transform: 'none', filter: 'blur(0)' },
        { filter: 'blur(1px)', offset: 0.5 },
        // Here we transform the reel to move up and stop at the top of last item
        // "(Number of item - 1) * height of reel item" of wheel is the amount of pixel to move up
        // 7.5rem * 16 = 120px, which equals to reel item height
        { transform: `translateY(-${(this.maxReelItems - 1) * (7.5 * 16)}px)`, filter: 'blur(0)' }
      ],
      {
        duration: this.maxReelItems * 100, // 100ms for 1 item
        easing: 'ease-in-out',
        iterations: 1
      }
    );

    this.reelAnimation?.cancel();
  }

  /**
   * Setter for name list
   * @param names  List of names to draw a winner from
   */
  set names(names: string[]) {
    this.nameList = names;

    const reelItemsToRemove = this.reelContainer?.children
      ? Array.from(this.reelContainer.children)
      : [];

    reelItemsToRemove
      .forEach((element) => element.remove());

    this.havePreviousWinner = false;

    if (this.onNameListChanged) {
      this.onNameListChanged();
    }
  }

  /** Getter for name list */
  get names(): string[] {
    return this.nameList;
  }

  /** Setter for current player */
  set currentPlayerName(name: string) {
    this.currentPlayer = name;
  }

  /** Getter for current player */
  get currentPlayerName(): string {
    return this.currentPlayer;
  }

  /** Setter for lucky moneys list */
  set luckyMoneys(luckyMoneys: string[]) {
    this.luckyMoneyList = luckyMoneys;
  }

  /** Getter for lucky moneys list */
  get luckyMoneys(): string[] {
    return this.luckyMoneyList;
  }

  /** Setter for history list */
  set drawHistories(histories: string[]) {
    this.drawHistory = histories;
  }

  /** Getter for history list */
  get drawHistories(): string[] {
    return this.drawHistory;
  }

  /**
   * Setter for shouldRemoveWinner
   * @param removeWinner  Whether the winner should be removed from name list
   */
  set shouldRemoveWinnerFromNameList(removeWinner: boolean) {
    this.shouldRemoveWinner = removeWinner;
  }

  /** Getter for shouldRemoveWinner */
  get shouldRemoveWinnerFromNameList(): boolean {
    return this.shouldRemoveWinner;
  }

  /**
   * Returns a new array where the items are shuffled
   * @template T  Type of items inside the array to be shuffled
   * @param array  The array to be shuffled
   * @returns The shuffled array
   */
  private static shuffleNames<T = unknown>(array: T[]): T[] {
    const keys = Object.keys(array) as unknown[] as number[];
    const result: T[] = [];
    for (let k = 0, n = keys.length; k < array.length && n > 0; k += 1) {
      // eslint-disable-next-line no-bitwise
      const i = Math.random() * n | 0;
      const key = keys[i];
      result.push(array[key]);
      n -= 1;
      const tmp = keys[n];
      keys[n] = key;
      keys[i] = tmp;
    }
    return result;
  }

  /**
   * Returns a new array where the items are shuffled
   * @template T  Type of items inside the array to be shuffled
   * @param array  The array to be shuffled
   * @returns The shuffled array
   */
  private static shuffleLuckyMoneys<T = unknown>(array: T[]): T[] {
    const keys = Object.keys(array) as unknown[] as number[];
    const result: T[] = [];
    for (let k = 0, n = keys.length; k < array.length && n > 0; k += 1) {
      // eslint-disable-next-line no-bitwise
      const i = Math.random() * n | 0;
      const key = keys[i];
      result.push(array[key]);
      n -= 1;
      const tmp = keys[n];
      keys[n] = key;
      keys[i] = tmp;
    }
    return result;
  }

  public async beforeSpin(): Promise<boolean> {
    if (!this.nameList.length) {
      console.error('Name List is empty. Cannot start spinning.');
      return false;
    }

    if (this.onSpinStart) {
      this.onSpinStart();
    }

    // Shuffle names and create reel items
    let randomNames = Slot.shuffleNames<string>(this.nameList);

    while (randomNames.length && randomNames.length < this.maxReelItems) {
      randomNames = [...randomNames, ...randomNames];
    }

    randomNames = randomNames.slice(0, this.maxReelItems - Number(this.havePreviousWinner));

    const playerName = randomNames[randomNames.length - 1];

    // Update current player
    this.currentPlayer = playerName;
    return true;
  }

  public async spinName(): Promise<boolean> {
    if (!this.nameList.length) {
      console.error('Name List is empty. Cannot start spinning.');
      return false;
    }

    // Shuffle names and create reel items
    let randomNames = Slot.shuffleNames<string>(this.nameList);

    while (randomNames.length && randomNames.length < this.maxReelItems) {
      randomNames = [...randomNames, ...randomNames];
    }

    randomNames = randomNames.slice(0, this.maxReelItems - Number(this.havePreviousWinner));

    const playerName = randomNames[randomNames.length - 1];

    // Update current player
    this.currentPlayer = playerName;

    const currentPlayerElement = document.getElementById('current-player') as HTMLElement;
    // Random between slot.names before actually render the current player
    for (let i = 0; i < this.names.length * 6; i += 1) {
      currentPlayerElement.textContent = `Selecting... ${this.names[Math.floor(Math.random() * this.names.length)]}`;
      // Slow down the animation each time
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 20 * (i + 1)));
    }
    currentPlayerElement.textContent = `⭐️ ${playerName} ⭐️`;

    return true;
  }

  /**
   * Function for spinning the slot
   * @returns Whether the spin is completed successfully
   */
  public async spin(): Promise<boolean> {
    if (!this.nameList.length && !this.luckyMoneyList.length) {
      console.error('Name List and Lucky Money List is empty. Cannot start spinning.');
      return false;
    }

    if (this.onSpinStart) {
      this.onSpinStart();
    }

    await this.spinName();

    const { reelContainer, reelAnimation, shouldRemoveWinner } = this;
    if (!reelContainer || !reelAnimation) {
      return false;
    }

    // Shuffle lucky moneys
    let randomLuckyMoneys = Slot.shuffleLuckyMoneys<string>(this.luckyMoneyList);
    while (randomLuckyMoneys.length && randomLuckyMoneys.length < this.maxReelItems) {
      randomLuckyMoneys = [...randomLuckyMoneys, ...randomLuckyMoneys];
    }

    randomLuckyMoneys = randomLuckyMoneys.slice(
      0,
      this.maxReelItems - Number(this.havePreviousWinner)
    );

    const playerLuckyMoney = randomLuckyMoneys[randomLuckyMoneys.length - 1];

    const fragment = document.createDocumentFragment();

    randomLuckyMoneys.forEach((luckyMoney) => {
      const newReelItem = document.createElement('div');
      newReelItem.innerHTML = luckyMoney;
      fragment.appendChild(newReelItem);
    });

    reelContainer.appendChild(fragment);

    console.log('Displayed items: ', randomLuckyMoneys);
    console.log('Result: ', this.currentPlayer, playerLuckyMoney);

    // Remove winner form name list if necessary
    if (shouldRemoveWinner) {
      this.nameList.splice(this.nameList.findIndex(
        (name) => name === this.currentPlayer
      ), 1);
      this.luckyMoneyList.splice(this.luckyMoneyList.findIndex(
        (luckyMoney) => luckyMoney === playerLuckyMoney
      ), 1);

      // Update history
      this.drawHistory.push(`${this.currentPlayer} - ${playerLuckyMoney}`);
      // Add history breakpoint if all players have been drawn
      if (!this.nameList.length && !this.luckyMoneyList.length) {
        this.drawHistory.push('-------END-------');
      }
    }

    console.log('Remaining players: ', this.nameList);
    console.log('Remaining lucky money: ', this.luckyMoneyList);

    // Play the spin animation
    const animationPromise = new Promise((resolve) => {
      reelAnimation.onfinish = resolve;
    });

    reelAnimation.play();

    await animationPromise;

    // Sets the current playback time to the end of the animation
    // Fix issue for animatin not playing after the initial play on Safari
    reelAnimation.finish();

    Array.from(reelContainer.children)
      .slice(0, reelContainer.children.length - 1)
      .forEach((element) => element.remove());

    this.havePreviousWinner = true;

    if (this.onSpinEnd) {
      this.onSpinEnd();
    }
    return true;
  }
}
