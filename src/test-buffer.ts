import { interval } from 'rxjs';
import { bufferTime, groupBy, mergeMap, map } from 'rxjs/operators';

const eventSource = interval(1000).pipe(
    map((value) => ({ name: `Event ${value + 1}` })) // Emit objects with a name value
  );

eventSource
  .pipe(
    bufferTime(10000), // Buffer events for 60 seconds
    groupBy(() => 'group'), // Group all events into a single group
    mergeMap((group) =>
      group.pipe(
        map((events) => events.length) // Calculate the length of each group
      )
    )
  )
  .subscribe((groupLength) => {
    console.log(`Group length in the last 10 seconds: ${groupLength}`);
  });
