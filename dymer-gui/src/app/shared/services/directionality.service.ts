import { Direction, Directionality } from '@angular/cdk/bidi';
import { EventEmitter, Injectable, OnDestroy, WritableSignal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppDirectionality implements Directionality, OnDestroy {
  // writable signal that consumers can read/react to
  valueSignal!: WritableSignal<Direction>;

  constructor() {
    // initialize the signal with the current backing value (set below)
    this.valueSignal = signal<Direction>(this._value);

    // keep the signal in sync whenever the EventEmitter emits a new direction
    this.change.subscribe(dir => this.valueSignal.set(dir));
  }
  readonly change = new EventEmitter<Direction>();

  get value(): Direction {
    return this._value;
  }
  set value(value: Direction) {
    this._value = value;
    this.change.next(value);
  }
  private _value: Direction = 'ltr';

  ngOnDestroy() {
    this.change.complete();
  }
}
