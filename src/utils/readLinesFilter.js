import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const fileStream = createReadStream(ban_list);
const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity
});
export default function(filter){
    let result=[]
    for await (const line of rl) {
        if(!line.includes(filter)) result.push(line)
    }
    return result
}
