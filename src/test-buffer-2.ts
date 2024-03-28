import { from, interval, Observable } from 'rxjs';
import { map, bufferTime, mergeMap, groupBy, reduce } from 'rxjs/operators';

// Function to generate a random color
function getRandomColor(): string {
  const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const intervalMs = 1000;

// Create an observable that emits objects with random colors every second
const colorObservable$: Observable<{ color: string }> = interval(intervalMs).pipe(
  map(() => ({ color: getRandomColor() }))
);

// Create a sliding window of 10 seconds with 5 seconds overlap
const slidingWindow$: Observable<{ color: string; count: number }> = colorObservable$.pipe(
  bufferTime(10000, 5000), // 10 seconds window with 5 seconds overlap
  mergeMap(window =>
    // Group values by color within each window
    from(window).pipe(
      groupBy((window) => window.color),
      mergeMap((group$) =>
        group$.pipe(
          // Count the items in each color group
          reduce((acc, curr) => acc + 1, 0),
          map((count) => ({ color: group$.key, count }))
        )
      )
    )
  )
);

// Subscribe to the sliding window observable to get the counts for each color group
slidingWindow$.subscribe((colorGroups) => {
  //console.log(`Window: ${new Date().toISOString()}`);
  //console.log('colorGroups');
  console.log(colorGroups);
  // colorGroups.forEach(({ color, count }) => {
  //   console.log(`Color: ${color}, Count: ${count}`);
  // });
});





