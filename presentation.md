---
title: "Advanced Angular (for Kadaster)"

---

## Advanced Angular

## Kadaster

---

### Table of Contents

- 3 cases, per case
- Mixed with some (relevant) theoretical approaches
- Looking at modern best-practices
- Examples and experiments per case

// To be done after.

Note: We'll consider each case, then we'll dive into some (relevant) theory and modern best-practices, followed by some examples and possible experiments we can do.

----

## Goals

Note: Any goals from the audience? What would you hope to learn today? My take is: Generate ideas and actions for the team to take on. Input for future discussions, refinements and actions to undertake as a team. Make sure you have somewhere (in the repo later? Or a shared spot?) where you can write down any ideas and actions the team needs to discuss after in your opinion.

---

// QR code to repo (no notes? Or put them in a separate folder/repo?)

---

### Case 1 
#### "Derived state"

----

Write down for yourself <br /><small>(NOTES.md, paper, comments...)</small>

- What are things that stand out?<!-- .element: class="fragment" -->
- What looks nice?<!-- .element: class="fragment" -->
- What might we want to improve?<!-- .element: class="fragment" -->

<small class="fragment">`./code/project-detail/medewerkers-aanpassen/`</small>

Note: Get code (Medewerkers-aanpassen)[./code/project-detail/medewerkers-aanpassen/] on screen. We'll take 5-10 minutes to go through 

----

## Discuss

Note: Let's go over some of these points of attention, do we have shared concerns? Can we agree on parts that are nice?

---

<!-- [BLOCK] No functions in HTML -->

```ts
medewerkerIsCurrentGebruiker(verkorteGebruikersNaam: string): boolean {
    return this.gebruiker?.userName === verkorteGebruikersNaam;
}
```

```html
<button *ngIf="
    !medewerkerIsCurrentGebruiker(
        addedMedewerkersFormArray.value[i].verkorteGebruikersNaam
    )"
    aria-label="Medewerker van project verwijderen."
    type="button"
    (click)="confirmMedewerkerDeletion(assignedGebruikersList![i])"
>X</button>
```
<!--- .element: class="fragment" -->

Note: Can anyone tell me what is wrong with this construction?

----

### Functions in HTML

- Trigger change detection often and unexpectedly
- Possible performance issues
- Bad practice

Exception when it comes to `signal()` !
<!-- .element: class="fragment" -->

<small>

[Angular.dev](https://angular.dev/guide/templates/pipes#creating-custom-pipes)

</small>

Note: Triggering a bunch of change detection, possibly creating performance issues when doing expensive calculations. Generally just bad practice. How can we proof that this is a bad idea? Exercise?

----

```ts
console.count('trigger')
```

Note: Easy to check how many times a function is being called, and how often. The above example works well with the example code in the Stackblitz.

----

## How to fix?

Note: Discuss first, then go over possible solutions.

----

### Pipes 

❌ Bad example

```ts
@Pipe({
  name: 'isCurrentUser',
  pure: false // <--- This is indicating this might be a bad idea!
})
// Naming convention to indicate overuse of this Pipe might be bad.
export class IsCurrentUserImpurePipe implements PipeTransform {

  //  private userStore = inject(userStore) <-- Don't do this. Makes it impure!

  transform(value: string): boolean {
    return value === this.userStore.currentUser
  }
}
```

----

### Pipes

✅ Good example

```ts
@Pipe({
  name: 'isCurrentUser',
  pure: true
})
export class IsCurrentUserPipe implements PipeTransform {
  transform(value: string, username: string): boolean {
    return value === username // Or whatever comparison logic makes sense here.
  }
}
```

```html
<!-- Usage example: -->
@if(item.naam | IsCurrentUser:currentUser.naam) {
    <button (click)="remove(item)">
        X
    </button>
}
```

Note: Free memoization! Only recalculated when one of the values changes! This example only compares 2 strings, so maybe a rename would work better here for reusability? ;-) Unless it contains more user specific logic.

----

### Read-optimize the model

```ts
addMedewerkerToList(medewerker) {
    // ...

    const medewerkersForm = this.formBuilder.group({
      verkorteGebruikersNaam: [ medewerker.verkorteGebruikersNaam, Validators.required, ],
      projectGebruikerRolWaarde: [null, Validators.required],
      isMe: [ // <-- For example! 
        { value: medewerker.verkorteGebruikersNaam === this.gebruiker?.userName, 
          disabled: true }, 
      ]
    });

    this.addedMedewerkersFormArray.push(medewerkersForm);
}
```

```html
 <button *ngIf="!addedMedewerkersFormArray.value[i].isMe">
```

Note: Calculate once, use everywhere. 

----

## Try it!

Note: Take some time (5-10m) to experiment with these options. Or perhaps we take a bigger block of time after this section to try multiple things at once. If we do this, go around the group and ask what they tried, what they found.

<!-- [/BLOCK] -->

---

<!-- [BLOCK] Smart vs. Presentational components -->

### Smart vs. Presentational

<small>
Resources:

[Angular University](https://blog.angular-university.io/angular-2-smart-components-vs-presentation-components-whats-the-difference-when-to-use-each-and-why/)

</small>


----

What is a presentational component? How does it differ from a "Smart" one?

Note: Who can explain to me the difference between Smart and Presentational components? Also mention smart vs. dumb components

----

```ts
@Component({
  standalone: true,
  selector: 'app-todo-list',
  imports: [CommonModule],
  template: `
    <ul>
      <li *ngFor="let todo of todos">
        <label>
          <input type="checkbox" [checked]="todo.done" (change)="toggle.emit(todo.id)" />
          {{ todo.title }}
        </label>
      </li>
    </ul>
  `
})
export class TodoListComponent {
  @Input() todos: Todo[] = [];
  @Output() toggle = new EventEmitter<number>();
}
```

----

```ts
@Component({
  standalone: true,
  selector: 'app-todo-list-container',
  imports: [TodoListComponent],
  template: `<app-todo-list [todos]="todos()" (toggle)="onToggle($event)" />`,
})
export class TodoListContainerComponent {
  private todoService = inject(TodoService);
  todos = signal(this.todoService.getTodos());

  onToggle(id: number) {
    this.todoService.toggleDone(id);
    this.todos.set(this.todoService.getTodos());
  }
}
```

----

## Benefits

- Seperation of Concerns<!-- .element: class="fragment" -->
- Improved testing<!-- .element: class="fragment" -->
- Reusability<!-- .element: class="fragment" -->
- Easier refactoring<!-- .element: class="fragment" -->
- More scalable architecture<!-- .element: class="fragment" -->

----

## Discuss

Note: Try it? Although a refactoring like this might take some additional time. Take 5-10 minutes to discuss if there's value in splitting this component into a more Presentational one? What's the downside?

<!-- [/BLOCK] -->

---

```ts
loadAllGebruikers() {
  this.loadAndSubscribeUnassignedGebruikers();
  this.loadAndSubscribeAssignedMedewerkers();
}
```

Note: Let's talk about this. Anyone knows how many times this is being called in the component by heart? Seems like there are no refresh mechanisms, no syncing with database in between actions, nothing like that.

----

<!-- [BLOCK] Data & Stream Management / Viewmodels -->
## Data management

### What do we actually need?
<!-- .element: class="fragment" -->

Note: So let us talk a bit about the data management for components like these. (Note; not directly talking about state management here, but that might factor into it) - What do we actually need to start/use our component? Discuss.

----

```ts
dataUnassigned$ = this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode)

// Is there anything wrong with this?
```

Note: Is there anything wrong with this? (Think cold observables, takeUntilDestroyed perhaps).

----

```ts
dataUnassigned$ = this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode)
                        .pipe(takeUntilDestroyed());

// What about now? This is even still considering that the underlying call is possibly a Hot Observable and may emit more then one value. Which it probably does not as it's just a REST call? Let's take it a step further.
```

----

```ts
data$ = forkJoin([
          this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode),
          this.loadAssignedMedewerkers(this.projectNumber, this.projectTypeCode)  
        ]).pipe(takeUntilDestroyed())

// data$ is now of type Observable<[Gebruikers[], Medewerkers[]]>
```

----

>...Lastly, if you are working with observables that only emit one value, or you only require the last value of each before completion, forkJoin is likely a better option.

<small>
Resources:

https://www.learnrxjs.io/learn-rxjs/operators/combination/forkjoin#why-use-forkjoin
https://www.learnrxjs.io/learn-rxjs/operators/combination/combinelatest

</small>

Note: forkJoin vs. combineLatest - 

----

### What about the component assignments we have to do?

```ts
initializeAssignedMedewerkers()
mapAssignedMedewerkers()
```
<!-- .element: class="fragment" -->

Note: What do we do with these (imperatively called) functions? How could we make sure we are preparing and building the component state in the correct way so we can present it correctly to our user?

----

// TODO The main questions and work to do is in these comments:
// TODO Add the map and initialize to a `tap()`, or a `map()` inside the pipe to get the correct internal model before passing it along. Tap for the side effect. Make it a part of the initial function later? Keep the definition clean! Split into multiple slides with some explanation? Maybe use the magic `toSignal()` in the end to have subscription management be completely managed by Angular? Just use the signal -> Read/Write Signals for internal state? Might be a Tap thing...

----

# Try it!

Note: Let's take 10-15m to see if we can easily build up (part) of the initialization into an Observable? Can we turn it into a Signal too?

---

// TODO Probably done with this.
// Gaat natuurlijk over die gekke RxJS constructies. Of het niet makkelijker te combineren is, evt. op Service niveau?
// Wat doet die stream precies? En hoe vaak halen we data op? Meeste lijkt eenmalig te zijn en daarna frontend state.
// Link met vorige sectie, data voor dit component zou prima uit een parent kunnen komen als een lijst (met verrijkt object "isMember true/false") of als een object met twee lijsten.
// Try it vs. Discuss? Verwijst mogelijk ook terug naar 1e voorbeeld -> Mappers in het Component, zouden ook in de Service kunnen. Zo werk je intern in je Frontend model enkel met wat de views en de logica daar nodig heeft. Eenmalig omrekenen en verder lekker gebruiken as-is?

----

<!-- [/BLOCK] -->

---

// TODO -

Case 2 / 3
 - Testing?
 - HTML testing into -> expected results. 
   - Verschillende strategieën
   - Marmicode (Younes) z'n spul al referentie gebruiken

TODO... Nog een case? Als de resterende code voorbeelden lijken op bestaande, kijken of we daar klassikaal doorheen kunnen met wat we nu spotten? Hoe zouden we dit aanpakken?
Aanvullend; zit er een kans om de twee "medewerkers-aanpassen" componenten als een gedeeld herbruikbaar component in te zetten? Zitten er werkelijke (logica) verschillen tussen de componenten? Of zouden die, gevoed door de juiste lijsten, prima kunnen emitten wat de nieuwe lijst moet zijn voor persisting?