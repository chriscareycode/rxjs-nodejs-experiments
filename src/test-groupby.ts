/**
 * This is a test script to demonstrate the use of the RxJS groupBy operator.
 */
import { Observable, interval, of } from 'rxjs';
import { windowTime, mergeAll, count, take, mergeMap, groupBy, toArray } from 'rxjs/operators';

const colors = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'white',
  'gray',
  'black',
];

interface Payload {
  color: string;
  x: number;
}

// Create a stream of events
const eventStream = new Observable<Payload>((subscriber) => {
  let count = 0;
  setInterval(() => {
    const random = colors[Math.floor(Math.random() * colors.length)];
    subscriber.next({
      color: random,
      x: count++
    });
  }, 100); // Emit events every 100 milliseconds
});

// Use the windowTime operator to create windows, then count each window
const windowDurationSeconds = 5;
const windowDurationMs = windowDurationSeconds * 1000;

const eventCountStream = eventStream.pipe(
  windowTime(windowDurationMs),
  mergeMap(window => window.pipe(count()))
);

// Subscribe to the event count stream
eventCountStream.subscribe((count) => {
  console.log(`Events per ${windowDurationSeconds} seconds: ${count}`);
});

// const eventGroupStream = eventStream.pipe(
//   groupBy(window => window.color),
//   windowTime(windowDuration),
//   mergeMap(window => window.pipe(count()))
// );

// this works well for grouping and counting, but no name
// const eventGroupStream = eventStream.pipe(
//   windowTime(windowDuration),
//   mergeMap(window => window.pipe(
//     groupBy(window => window.color),
//     mergeMap(windowGroup => windowGroup.pipe(
//       count()
//     )),
//   ))
// );

const groupByField = 'color';

// this works for window, group, count, and output name/value pairs!
const eventGroupStream = eventStream.pipe(
  windowTime(windowDurationMs),
  mergeMap(window => window.pipe(
    groupBy(window => window[groupByField]),
    mergeMap(windowGroup => windowGroup.pipe(
      toArray(),
      mergeMap(items => {
        const groupName = windowGroup.key;
        const count = items.length;
        return of({ groupName, count });
      })
      //count()
    )),
  ))
);

// not working, but close
// const eventGroupStream = eventStream.pipe(
//   windowTime(windowDuration),
//   mergeMap(window => window.pipe(
//     groupBy(window => window.color),
//     mergeMap(group$ => {
//       group$.pipe(
//         toArray(),
//         mergeMap(items => {
//           const groupName = group$.key;
//           const count = items.length;
//           return of({ groupName, count });
//         })
//       )
//     }),
//   ))
// );

// Subscribe to the grouped stream
eventGroupStream.subscribe((event) => {
  console.log(event);
});

// Subscribe to the full stream
// eventStream.subscribe((event) => {
//   console.log(event);
// });

console.log('rxjs groupBy routine starting...');
console.log(`Window: ${windowDurationSeconds}s`);
console.log(`Group By Field: ${groupByField}`);
