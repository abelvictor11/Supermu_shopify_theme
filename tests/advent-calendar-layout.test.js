const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mosaicLayout}=require('../assets/advent-calendar-state');

test('mosaics support every editable duration without missing, overlapping or unordered days',()=>{
  assert.equal(typeof mosaicLayout,'function');
  for(let count=1;count<=31;count++)for(const columns of [3,5]){
    const layout=mosaicLayout(count,columns);
    const rows=layout.rows;
    assert.ok(rows.length>0);
    assert.ok(rows.every(row=>row.length===Math.min(count,columns)));
    const cells=rows.flat();
    let previous=-1;
    for(let day=1;day<=count;day++){
      const name=`day${day}`,positions=[];
      rows.forEach((row,y)=>row.forEach((cell,x)=>{if(cell===name)positions.push([x,y]);}));
      assert.ok(positions.length>0,`${count}/${columns}: ${name}`);
      const first=cells.indexOf(name);assert.ok(first>previous);previous=first;
      const xs=positions.map(p=>p[0]),ys=positions.map(p=>p[1]);
      const area=(Math.max(...xs)-Math.min(...xs)+1)*(Math.max(...ys)-Math.min(...ys)+1);
      assert.equal(positions.length,area,`${name} must be rectangular`);
    }
    assert.ok(cells.every(cell=>/^day\d+$/.test(cell)||layout.decorations.includes(cell)));
    assert.ok(cells.filter(cell=>cell.startsWith('day')).every(cell=>Number(cell.slice(3))<=count));
    assert.ok(rows[rows.length-1].some(cell=>cell.startsWith('day')));
  }
});

test('19-day staging range retains mixed tile sizes instead of reverting to a rigid grid',()=>{
  assert.equal(typeof mosaicLayout,'function');
  const layout=mosaicLayout(19,5),cells=layout.rows.flat();
  assert.ok(layout.decorations.length>0);
  assert.ok(cells.filter(c=>c==='day7').length>1);
  assert.ok(cells.includes('day19'));
});
