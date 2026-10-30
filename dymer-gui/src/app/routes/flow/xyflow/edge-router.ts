export function routeOrthogonalAvoidObstacles(
  sx: number, sy: number,
  tx: number, ty: number,
  obstacles: {x: number, y: number, w: number, h: number}[]
): string {
  // Padding around nodes
  const pad = 24;
  // Stub extends horizontally from handles
  const stub = 24;

  const p1 = { x: sx + stub, y: sy };
  const p2 = { x: tx - stub, y: ty };

  // Collect grid coordinates
  const Xs = new Set<number>([sx, p1.x, tx, p2.x]);
  const Ys = new Set<number>([sy, p1.y, ty, p2.y]);

  const rects = obstacles.map(n => {
    const left = n.x - pad;
    const right = n.x + n.w + pad;
    const top = n.y - pad;
    const bottom = n.y + n.h + pad;
    Xs.add(left); Xs.add(right);
    Ys.add(top); Ys.add(bottom);
    return { left, right, top, bottom };
  });

  const xArr = Array.from(Xs).sort((a,b) => a-b);
  const yArr = Array.from(Ys).sort((a,b) => a-b);

  const getPt = (xi: number, yi: number) => `${xi},${yi}`;

  const isInsideObstacle = (x: number, y: number) => {
    for (const r of rects) {
      if (x > r.left + 0.1 && x < r.right - 0.1 && y > r.top + 0.1 && y < r.bottom - 0.1) {
        return true;
      }
    }
    return false;
  };

  const startNode = { xi: xArr.indexOf(p1.x), yi: yArr.indexOf(p1.y) };
  const endNode = { xi: xArr.indexOf(p2.x), yi: yArr.indexOf(p2.y) };

  let openList = [{...startNode, g: 0, f: 0, dir: 'N'}];
  let closed = new Set<string>();
  let cameFrom = new Map<string, {xi: number, yi: number}>();

  let iterations = 0;

  // Simplified A* Pathfinding over non-uniform grid
  while(openList.length > 0 && iterations++ < 1500) {
    openList.sort((a,b) => a.f - b.f);
    const curr = openList.shift()!;
    const key = getPt(curr.xi, curr.yi);

    if (curr.xi === endNode.xi && curr.yi === endNode.yi) {
      const path = [];
      let c: any = curr;
      while(c) {
          path.push({x: xArr[c.xi], y: yArr[c.yi]});
          const prev = cameFrom.get(getPt(c.xi, c.yi));
          if (!prev) break;
          c = {xi: prev.xi, yi: prev.yi, g:0, f:0, dir:'N'};
      }
      path.reverse();
      let d = `M ${sx},${sy} L ${p1.x},${p1.y}`;
      for (const pt of path) { d+= ` L ${pt.x},${pt.y}`; }
      d += ` L ${tx},${ty}`;
      return d;
    }

    closed.add(key);

    const neighbors = [
      {dx: -1, dy: 0, dir: 'X'}, {dx: 1, dy: 0, dir: 'X'},
      {dx: 0, dy: -1, dir: 'Y'}, {dx: 0, dy: 1, dir: 'Y'}
    ];

    for (const n of neighbors) {
      const nxi = curr.xi + n.dx;
      const nyi = curr.yi + n.dy;

      if(nxi < 0 || nxi >= xArr.length || nyi < 0 || nyi >= yArr.length) continue;
      const nKey = getPt(nxi, nyi);
      if(closed.has(nKey)) continue;

      const cx = xArr[curr.xi]; const cy = yArr[curr.yi];
      const nx = xArr[nxi];     const ny = yArr[nyi];

      if (isInsideObstacle((cx+nx)/2, (cy+ny)/2)) continue;

      const dist = Math.abs(nx - cx) + Math.abs(ny - cy);
      // Heacy penalty for changing direction to favor fewer segments
      const turnPenalty = (curr.dir !== 'N' && curr.dir !== n.dir) ? 50 : 0; 
      
      const g = curr.g + dist + turnPenalty;
      const h = Math.abs(nx - xArr[endNode.xi]) + Math.abs(ny - yArr[endNode.yi]);
      const f = g + h;

      const existingIdx = openList.findIndex(o => o.xi === nxi && o.yi === nyi);
      if (existingIdx === -1 || g < openList[existingIdx].g) {
        cameFrom.set(nKey, {xi: curr.xi, yi: curr.yi});
        if (existingIdx !== -1) {
            openList[existingIdx].g = g;
            openList[existingIdx].f = f;
            openList[existingIdx].dir = n.dir;
        } else {
            openList.push({xi: nxi, yi: nyi, g, f, dir: n.dir});
        }
      }
    }
  }

  // Fallback to simpler path if no path found or exceeding max iterations
  return `M ${sx},${sy} L ${p1.x},${p1.y} L ${p1.x},${p2.y} L ${p2.x},${p2.y} L ${tx},${ty}`;
}
