var mousePoint= {x: 0, y: 0}
var intersectionPoint= {x: 0, y: 0}
var intersectionPointsCount = 0;
var polygonA=[], polygonB=[], RESULT=[]; RESULT2=[];
var intersA=[];
var count = 0; // определяет введены ли вершины многоугольников ( -1 значит введены оба многоугольника А и В; 0 - вводится А; 1 - А введен, вводим В)
var resTablesCreatedFlag = false;
var svgElem = document.getElementsByTagName('svg')[0];  // родительский элемент ипользуется при "удалении" потомков (кружочков и многоугольников)
var movingVertex = { isMoving: false, polygon: null, index:-1}     // флажок определяющий, перемещаем ли вершину + индекс выбранной вершины многоугольника (-1 значит никакая вершина не выбрана)



function intersects(fig1, fig2) {
// принимаем 2 массива с координатами многоугольников и высчитываем массив с массивами координат многоугольников-пересечений	
  polygonA=fig1.slice();
  polygonB=fig2.slice();
  count=-1;    // флажок завершения ввода вершин всех многоугольников
  polygonA[0].indexSvgPath = 0;
  polygonB[0].indexSvgPath = 1;
  polygonA.forEach(  
  	function (point, i) { 
  		point.indexSvgCircle = svgElem.children.length;
  		drawCircle(document.querySelector('svg.base'), point,  5, 'orange'); 
  	}  ); 
  polygonB.forEach(  
  	function (point, i) { 
  		point.indexSvgCircle = svgElem.children.length;
  		drawCircle(document.querySelector('svg.base'), point,  5, 'orange'); 
  		point.x+=0.000001; point.y+=0.000001;  // добавляем мизерное значение, чтоб не мучаться с совпадением сторон и вершин многоугольников А и В
  	}  );     
  fSameDirection();

  return RESULT
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//  Cоздаем дополнительные элементы HTML 
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	
  fHeadCreate('h3','Вычисляем многоугольники, полученные в результате пересечения входных многоугольников А и В');
  var printer1 = document.createElement('p');
  printer1.innerHTML = '<em> Многоугольники А и В <b>не должны</b> иметь самопересечений! </em>';
  document.body.appendChild(printer1);
  var printer2 = document.createElement('p');
  document.body.appendChild(printer2);
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function f1() {  
  if (isPointInsidePolygon(polygonA[0],polygonB)) {alert('А0 внутри В')} else {alert('А0 снаружи В')};
  if (isPointInsidePolygon(polygonB[0],polygonA)) {alert('B0 внутри A')} else {alert('B0 снаружи A')};
}

function f4() {  
  alert('Площадь А равна '+fpolygonS(polygonA.slice(), true) );
  alert('Площадь В равна '+fpolygonS(polygonB.slice(), true) );  
}


function fpolygonS(polygon, drawFlag) {// разрезает многоугольник на треугольники и вычисляет площадь первоначального многоугольника
  // триангуляция polygon для подсчета общей площади. Внимание! Имеет значение направление обхода - должно быть по часовой стрелке
  var cutedLength = polygon.length;
  if (cutedLength<3) return 0;
  var polygonDirection = fDirection(polygon, false); 
  if (polygonDirection==-1) {alert('Не могу посчитать площадь многоугольника при обходе против часовой'); return -10000}
  var currentVertex, nextVertex, exitPointTitle;
  var exitFlag;
  var commonS=0;
  var pointA = polygon[0];
  var pointB = fNextVertex(pointA);
  var pointC = fNextVertex(pointB);
  var vector1 = fVectorFromPoints(pointA, pointB);
  var vector2 = fVectorFromPoints(pointA, pointC);   
  var vector = fNormalVectorFromVector(vector1);
  var skalyr = fSkalyr(vector,vector2);
  // находим вектор AC , проверяем его скаляр с ПРАВОЙ нормалью для AB - если отрицательное значение при обходе по часовой стрелке (направление +1) - берем следующую точку и вектор 
  while (cutedLength>3) {   // ходим кругами, пока кол-во вершин в терзаемом многоугольнике не уменьшится до 3х
  //--------------------------------------------------------------------------------------------------------------------
      if (skalyr<0) { // скалярное произведение векторов vector2 и normalVector (от vector1)  отрицательное при обходе по часовой стрелке (направление +1) - значит угол между ними ( vector2 и normalVector ) тупой и векторы ( vector2 и normalVector ) смотрят в разные стороны, т.e. треугольник снаружи многоугольника и отрезать его для просчета площади нет смысла (по крайней мере со знаком +, а с минусом потом будет много заморочек)
        // alert(' треугольник с вершинами '+pointA.title+', '+pointB.title+', '+pointC.title+' - внешний');
        pointA = pointB;
  //--------------------------------------------------------------------------------------------------------------------    
      } else if (skalyr==0) { // отсекаем от polygon плоский (S==0) треугольник с вершинами ABC  // значит одна сторона многоугольника переходит в другую на одной прямой и получается не треугольник, а линия или треугольник площадью = 0.
          // alert(' отсекаем от polygon плоский (S==0) треугольник с вершинами '+pointA.title+', '+pointB.title+', '+pointC.title);
          fCutTriangle(pointA, pointB, pointC); 
          cutedLength--      
  //--------------------------------------------------------------------------------------------------------------------
      } else { // skalyr>0
          // alert(' Скалярное произведение больше 0. Треугольник с вершинами '+pointA.title+', '+pointB.title+', '+pointC.title);
          exitFlag=false; 
  //************  пока остается 5 или более вершин имеет смысл проверять пересечение AC со сторонами многоугольника, не прилегающим к ABC **********
          if (cutedLength>4) {
              currentVertex = fNextVertex(pointC);
              nextVertex = fNextVertex(currentVertex);
              do { 
                if (fSegmentsIntersection(pointA, pointC, currentVertex, nextVertex)) { 
                  exitFlag=true; 
                  // alert('Отрезок '+pointA.title+'-'+pointC.title+' пересекся c '+currentVertex.title+'-'+nextVertex.title+'. exitFlag='+exitFlag);
                }
                currentVertex=fNextVertex(currentVertex);
                nextVertex=fNextVertex(nextVertex);
                // if (!(confirm('Если nexVer='+nextVertex.title+'не совпадает с'+pointA.title+', в след. цикле проверим пересекаются ли '+pointA.title+'-'+pointC.title+' c '+currentVertex.title+'-'+nextVertex.title) )) return;
              } while ( !(nextVertex.title==pointA.title) && !(exitFlag) ); 
          }  
  //***********  еще надо убедиться, что внутрь отрезаемого треугольника не попала ни одна из остающихся вершин (кроме ABC и отрезанных) ************
          if (exitFlag) {} // if (!(confirm('Выполнять проверку попадания вершин в отсекаемый треугольник?') ) ) return;}  // если предыдущая проверка пересечений со сторонами уже показала пересечения, то пропускаем блок проверки попадания вершин в отсекаемый треугольник
            else { //блок проверки попадания вершин в отсекаемый треугольник
                nextVertex = fNextVertex(pointC);
                if (cutedLength==4) exitPointTitle = pointA.title
                  else exitPointTitle = fPrevVertex(pointA).title
                do { // кидаем из nextVertex любой луч и сотрим наличие пересечений с ABC 
                  fRay({x: nextVertex.x+0.000001, y: nextVertex.y+0.000001}, {p1: 100, p2: 100},  [pointA, pointB, pointC], false, 0); // здесь вектор может быть любой, (100,100) взят произвольно, а 0,000001 добавлено, чтоб исключить точное прохождение луча через вершины
                  if ((intersectionPointsCount) % 2 == 0)  {} // кол-во пересечений 0 или кратно 2 => проверяемая точка снаружи треугольника
                    else {
                      exitFlag=true; 
                      // alert('Вершина '+nextVertex.title+' попала внутрь отсекаемого треугольника '+pointA.title+'-'+pointB.title+'-'+pointC.title+'. В результате - exitFlag='+exitFlag);
                    }  
                  nextVertex = fNextVertex(nextVertex);
                  // if (!(confirm('Если nexVer='+nextVertex.title+'не совпадает с'+exitPointTitle+' в след. цикле проверим не попадает ли nexVer в отсекаемый треугольник '+pointA.title+'-'+pointB.title+'-'+pointC.title) )) return;
                } while ( !(nextVertex.title==exitPointTitle) && !(exitFlag) ); 
          }    
  //*************************************************************************************************************************************
          if (exitFlag) {pointA = pointB;} // флаг после проверок  АС на пересечения со сторонами многоугольника и попаданий вершин внутрь ABC
            else { // если пересечений нет и вершин в отрезаемом треугольнике нет - отрезаем треугольник от polygon, а его площадь - в копилку
                // alert(' отсекаем от polygon треугольник с вершинами '+pointA.title+', '+pointB.title+', '+pointC.title+' , площадь аккумулируем');
                commonS+= fSTriangle(vector1,vector2);
                if (drawFlag) fDrawLine ( [pointA, pointC] , document.querySelector('svg.base') );
                fCutTriangle(pointA, pointB, pointC); 
                cutedLength--
            }
      } // else { // skalyr>0      end of  if (skalyr<0)
  //--------------------------------------------------------------------------------------------------------------------
      pointB = pointC;
      pointC = fNextVertex(pointC);
      vector1 = fVectorFromPoints(pointA, pointB);
      vector2 = fVectorFromPoints(pointA, pointC);   
      normalVector = fNormalVectorFromVector(vector1);
      skalyr = fSkalyr(normalVector,vector2);
 //     alert(pointA.title+'-'+pointB.title+'-'+pointC.title);
  }   //  while (cutedLength>3) 
  return commonS + fSTriangle(vector1,vector2);
} // конец function fpolygonS(polygon) // разбивает многоугольник на треугольники и вычисляет многоугольника площадь

// Определяет положение точки одного многоугольника по отношению к другому многоугольнику (внутри или снаружи)
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
function isPointInsidePolygon(point,polygon){ // ВАЖНО! Точка point не должна принадлежать polygon - функция даст неверный ответ, т.к. луч кидается по стороне многоугольника, которму принадлежит point к point.next, а используемая внутри функция fRay учитывает параметр 0<t2<=1 ( t2=1 учитывается, а t2=0 нет)
  // чтобы определить находится точка А0 внутри или снаружи относительно В
  // кидаем луч из точки и считам пересечения с другим многоугольником
  var vector = fVectorFromPoints( point, fNextVertex(point) );  /*
  var  linePoints, nextPoint; 
  linePoints=[];
  linePoints.push(point);  
  nextPoint={x: point.x+vector.p1, y: point.y+vector.p2}
  linePoints.push(nextPoint); 
  fDrawLine ( linePoints , document.querySelector('svg.base') );  */
  fRay(point, vector, polygon, false, 0);
  if ((intersectionPointsCount) % 2 == 0) return false // 
  return true
}

//  Направление обхода 2х многоугольников отличаются => меняем для меньшего многоугольника
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
function fSameDirection() {   // Направления обхода должно быть по часовой
  if ((polygonA.length<3) || (polygonB.length<3)) return;
  fAddPrevNext(polygonA, 0);
  fAddPrevNext(polygonB, 1);
  var i, tempArray=[];
  var Adirection=fDirection(polygonA, false);
  if (Adirection==-1) {  // меняем направление для A
        for (i=polygonA.length; i>1; i--)  tempArray.push(polygonA.pop());
        polygonA=polygonA.concat(tempArray);
        fAddPrevNext(polygonA, 0);
  }  
  var Bdirection=fDirection(polygonB, false);
  if (Bdirection==-1) {   // меняем направление для В
  		tempArray=[];
        for (i=polygonB.length; i>1; i--) tempArray.push(polygonB.pop());
        polygonB=polygonB.concat(tempArray);
        fAddPrevNext(polygonB, 1);
  } 
  // теперь надо перестроить таблицы, переподписать вершины   //   alert('перерисовываем изменения ');
  if ((Adirection==-1) || ( Bdirection==-1)) {
    fTablesDelete(0);
    fTables();
  } 
  fClearSVG(polygonA.length+polygonB.length+2, svgElem)      // удаляем старые точки пересечения 
  fSignPoligons(); // подписываем вершины многоугольников: A0-А1-A2-A3.... B0-B1-B2-B3.....
  fPointsOfIntersection(polygonA,polygonB,true);        // запускаем поиск точек пересечений
  if (resTablesCreatedFlag) { fTablesDelete(2); }		
  fCreateResultTables();
}

// Определяем направление обхода многоугольника - по или против часовой стрелки
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
function fDirection(polygon, drawFlag){
// Находим правый вектор. Если он, исходя из точки в середине стороны многоугольника, пересекает многоугольник четное кол-во раз - значит обход многоугольника осуществляется против часовой
  if (polygon.length<3) {alert('Невозможно определить направление обхода для фигуры мене чем с 3 вершинами');return}
  var normalVector = fNormalVectorFromVector( fVectorFromPoints( polygon[0], polygon[1]) );  
  var centralPoint = fCenterPoint( polygon.slice(0,2));
  /*
  var linePoints=[];
  linePoints.push(centralPoint);  
  var nextPoint={x: centralPoint.x+normalVector.p1, y: centralPoint.y+normalVector.p2}
  linePoints.push(nextPoint); 
  fDrawLine ( linePoints , document.querySelector('svg.base') );
  */
  fRay(centralPoint, normalVector, polygon, drawFlag, 0.000005);  
  if ((intersectionPointsCount) % 2 == 0) {
    if (drawFlag) alert('Направление обхода многоугольника '+polygon[0].title[0]+' против часовой стрелки');  
    return -1 }
  if (drawFlag) alert('Направление обхода многоугольника '+polygon[0].title[0]+' по часовой стрелке'); 
  return +1
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Лучи -  Лучи -  Лучи -  Лучи -  Лучи -  Лучи -  Лучи -  Лучи -  Лучи -  Лучи 
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function fRay(Point, Vector, polygon, drawIntersectionsFlag, tolerance){
 // alert('Внутри fRay. Переданы точка ('+Point.x+';'+Point.y+' ) '+' вектор ('+Vector.p1+';'+Vector.p2+' drawIntersectionsFlag= '+drawIntersectionsFlag+' tolerance='+tolerance);
 // ниже идет перебор сторон многоугольника polygon для поиска точек пересечений с лучом из Point по Vector
 var nextVertex; 
 intersectionPointsCount = 0; 
 if  ((count!==-1) || (polygon.length<3)) return; // если фигуры не введены или представлены точками <3 - на выход
 // если фигура - многоугольник а не отрезок (только 2 точки), то последней стороной надо взять отрезок от последней к самой первой точке
 for (var j=0; j<polygon.length; j++) {  
      if ((j+1)==polygon.length) nextVertex = polygon[0]
        else nextVertex = polygon[j+1];
      if (fRayIntersection(Point, Vector,polygon[j], nextVertex, tolerance)){
        intersectionPointsCount++;
        if (drawIntersectionsFlag) drawCircle(document.querySelector('svg.base'), intersectionPoint,  4, 'blue'); 
        console.log('С лучом найдено '+intersectionPointsCount+' точек пересечений ');
      }   
 } 
}

function fRayIntersection(Point, vector1, pointC, pointD, tolerance){
// проверим отрезки на параллельность через определитель матрицы 2х векторов
  var vector2 = fVectorFromPoints(pointC,pointD);
  var opredelitel = fOpredelitel(vector1,vector2);  
  if (opredelitel!==0) { // если отрезки не параллельны - пытаемся найти точку пересечения  
    var tParametr = ( vector2.p1 * (Point.y-pointC.y) - vector2.p2 * (Point.x-pointC.x) ) / opredelitel;
    var t2Parametr = ( vector1.p1 * (Point.y-pointC.y) - vector1.p2 * (Point.x-pointC.x) ) / opredelitel;
    // если прямые пересекаются, а параметр t1<0, а t2 выходит за рамки [0;1] - луч и отрезок не пересекаются      
    if ( (!(tParametr>tolerance)) || (!(t2Parametr>0)) || (t2Parametr>1))  return false; 
    // если прямые пересекаются и параметры t1 или t2 в пределах (0;1) - вычисляем точку пересечения отрезков  
    // if (!(confirm('Пересекаются луч из'+Point.title+'по вектору {'+vector1.p1+':'+vector1.p2+'} и '+pointC.title+pointD.title+' Параметр t1='+tParametr+' , t2='+t2Parametr+'. Продолжить?') )) return;
    intersectionPoint.x = vector1.p1 * tParametr + Point.x;
    intersectionPoint.y = vector1.p2 * tParametr + Point.y; 
    return true;
  }
  return false; // определитель равен 0  =>  отрезки параллельны
}  

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Блок нахождения пересечений сторон многоугольников
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function fPointsOfIntersection(arrayA,arrayB,drawIntersectionsFlag){
  intersA=[]; 
  intersectionPointsCount = 0; 
  var Alength=arrayA.length;              
  var Blength=arrayB.length;   
  var title, delta, delta2;
  if  ((count!==-1) || (Alength<2) || (Blength<2)) return; // если фигуры не введены или массивы меньше 2х точек - на выход
  // если фигура - многоугольник, то последней стороной надо взять отрезок от последней к самой первой точке. 
  // ниже идет перебор сторон многоугольника arrayA для поиска точек пересечений с сторонами многоугольника arrayB 
  for (var i=0; i<arrayA.length; i++) {
    for (var j=0; j<arrayB.length; j++) {  
      if (fSegmentsIntersection(arrayA[i],arrayA[i].next,arrayB[j],arrayB[j].next)){
        if (drawIntersectionsFlag) drawCircle(document.querySelector('svg.base'), intersectionPoint,  4, 'red');  
        // формируем заготовку для элементов графа - точек intersA[k] - перекрестков, на которых возможен переход с A на обход сторон другого многоугольника B и наоборот
        title='I'+intersectionPointsCount;
        delta = Math.sqrt( Math.pow((arrayA[i].x-intersectionPoint.x),2) + Math.pow((arrayA[i].y-intersectionPoint.y),2));
        delta2 = Math.sqrt( Math.pow((arrayB[j].x-intersectionPoint.x),2) + Math.pow((arrayB[j].y-intersectionPoint.y),2));
        intersA.push( {title: title, x: intersectionPoint.x, y: intersectionPoint.y,
                       direction:  [ {delta:delta, prev:arrayA[i], next:arrayA[i].next} , {delta:delta2, prev:arrayB[j], next:arrayB[j].next} ] }  );
        intersectionPointsCount++;
      }   
    } 
  } 
  console.log('Найдено '+intersectionPointsCount+' точек пересечений ');
  intersA.forEach(  function(vertex, i) {fDrawText(svgElem, {x: vertex.x , y: vertex.y }, 'I'+i); }  );
  // теперь можем перестроить массивы многоугольников в графы   
  fGraf(0); 
  fGraf(1);
  // теперь будем ходить по графу и искать многоугольники-пересечения
  // начинаем с определения положения т.А0 относительно многоугольника В
  if (isPointInsidePolygon(polygonA[0],polygonB)) {
  //  alert('А0 внутри В');
    fAlgoritmInside(); 
  } 
  else {
 //   alert('А0 снаружи В');
    fAlgoritmOutside(polygonA[0]);
  }
  fClearSVG(0, document.getElementsByTagName('svg')[1]);

  // объединим, совпадающие точки

  // исключим фигуры с площадью менее 0,0001

  RESULT.forEach ( function (p) { drawPath(p, document.querySelector('svg.intersections'), 'red');  } );
}


// алгоритм поиска многоугольников-пересечений при старте из A0, находящейся ВНУТРИ второго многоугольника B
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
function fAlgoritmInside(){
  var Ifirst=null;
  var tempArray=[]; 
  RESULT=[];
  // обходим многоугольник А вперед в поиске точки пересечения I (по пути от А0 запоминаем точки в массив tempArray)
  var currentPoint=polygonA[0];
  var dir=0;
  do {
    // alert ('INSIDE currentPoint='+currentPoint.title+' Ifirst='+Ifirst)
    currentPoint.title += '+';  
    tempArray.push({x: currentPoint.x, y: currentPoint.y});
    currentPoint=fGrafNext(currentPoint, dir);
    if (currentPoint.title[0] == 'I') {
      if ( !(Ifirst)) { Ifirst = currentPoint;} // если найдена первая точка пересечения  - запоминаем ее
      dir=Math.abs(dir-1);
    }
  } while (!(currentPoint.title=='A0+')); // идем далее до возврата в А0, (по пути от А0 к А0 запоминаем точки в массив tempArray-это будет ОДИН из многоугольников-пересечений)
  // если вернулись в A0, а точка пересечения с В не найдена - многоугольник пересечения = tempArray
  if ( Ifirst == null ) { RESULT.push(tempArray); return }  
  // идем в обратном направлениии от А0 к Аn, находим точку пересечения I и запоминаем ее пред. соседа на А: Ilast =  I.direction[0].prev
  var Ilast=polygonA[0];
  do { 
    Ilast = fGrafPrev(Ilast, 0);
  } while ( !(Ilast.title[0] == 'I') );
  // добавляем в граф фиктивную вершину Af (без координат, ведь она фиктивная) между Ilast и Ifirst
  var Af={title: 'Af', prev: Ilast, next: Ifirst};
  Ilast.direction[0].next=Af;
  Ifirst.direction[0].prev=Af;
  // передаем точку Af как стартовую для обхода fAlgoritmOutside
  fAlgoritmOutside(Af);
  RESULT.push(tempArray);  
}

// алгоритм поиска многоугольников-пересечений при старте из некой точки первого многоугольника, находящейся СНАРУЖИ по отношению ко второму
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
function fAlgoritmOutside(startPoint){
  // идем по графу из А0 до первого пересечения
  RESULT=[];
  var currentPoint = startPoint;
  var newPolygon=[], pointNames=[];
  var dir=0; str='';
  var firstPointI=null;
  do {
    // alert ('currentPoint='+currentPoint.title)
  // 222222222222222222222222222222222222222222222222222222222222222222222222
    if (currentPoint.title[0] == 'I') {
      // 333333333333333333333333333333333333333333
      if (firstPointI==null) { // при первой встрече точки пересечения - начинаем записывать точки пути
          newPolygon=[]; 
          pointNames=[];
          newPolygon.push({x: currentPoint.x, y: currentPoint.y});
          pointNames.push(currentPoint.title);
          firstPointI=currentPoint;
          currentPoint=currentPoint.direction[dir].next;
      // 333333333333333333333333333333333333333333
      } else { //  если встреча т. пересечения не первая - 1) проверяем на совпадение с первой I 2) меняем dir и идем далее
          if (currentPoint.title==firstPointI.title) { // если текущая точка совпала с первой - круг замкнулся - первая фигура пересечения newPolygon найдена.
              console.log('Найдена фигура '+pointNames.join(' - '));
              RESULT.push(newPolygon);
              currentPoint.title += '+';     
              currentPoint=  firstPointI.direction[0].next;  
              firstPointI=null; 
              dir=0;                     
          } else { //  если currentPoint - точка пересечения и уже не первая на пути - меняем dir
              dir=Math.abs(dir-1);
              newPolygon.push({x: currentPoint.x, y: currentPoint.y});
              pointNames.push(currentPoint.title);
              currentPoint.title+='+';
              currentPoint=currentPoint.direction[dir].next;
          } // // end of else if (currentPoint.title==firstPointI.title)
      } // end of else if (firstPointI==null)
      // 333333333333333333333333333333333333333333
  // 222222222222222222222222222222222222222222222222222222222222222222222222
    } else {  // если currentPoint - вершина - шагаем далее 
        if (!(firstPointI==null)) { // если начали записывать координаты - продолжаем
          newPolygon.push({x: currentPoint.x, y: currentPoint.y}); 
          pointNames.push(currentPoint.title); 
          currentPoint.title+='+';
        }   
        currentPoint=currentPoint.next;
    } // end of else if (currentPoint.title[0] == 'I')
  // 222222222222222222222222222222222222222222222222222222222222222222222222
    while ( ~currentPoint.title.indexOf("+") ) {  // если в имени точки есть '+', то эту точку мы уже проходили.
 //     alert ('current+='+currentPoint.title)
      currentPoint=fGrafNext(currentPoint, 0);
    }      
  } while (!(currentPoint.title==startPoint.title));
  if ( !intersA.length && isPointInsidePolygon(polygonB[0],polygonA) ) {alert('B внутри A');  RESULT.push(polygonB); } ;
}


function fSegmentsIntersection(pointA,pointB,pointC,pointD){
  // проверим отрезки на параллельность через определитель матрицы 2х векторов
  var vector1 = fVectorFromPoints(pointA,pointB);
  var vector2 = fVectorFromPoints(pointC,pointD);
  var opredelitel = fOpredelitel(vector1,vector2);  
  if (opredelitel==0) { return false;  }  //  отрезки параллельны
  else {  // если отрезки не параллельны - пытаемся найти точку пересечения  
    var tParametr = ( vector2.p1 * (pointA.y-pointC.y) - vector2.p2 * (pointA.x-pointC.x) ) / opredelitel;
    var t2Parametr = ( vector1.p1 * (pointA.y-pointC.y) - vector1.p2 * (pointA.x-pointC.x) ) / opredelitel;
    
    // если прямые пересекаются, а параметры t1 или t2 выходят за рамки [0;1] - ОТРЕЗКИ не пересекаются  
    if ((tParametr<0) || (tParametr>1) || (t2Parametr<0) || (t2Parametr>1))  return false;
    
    // если прямые пересекаются и параметры t1 или t2 в пределах (0;1) - вычисляем точку пересечения отрезков  
    intersectionPoint.x = vector1.p1 * tParametr + pointA.x;
    intersectionPoint.y = vector1.p2 * tParametr + pointA.y; 
    return true;
  }
}

function fVectorFromPoints(point1,point2){
  var vector= {p1:point2.x-point1.x, p2:point2.y-point1.y}
  return vector;
}

function fNormalVectorFromVector(vector){
  // если имеется вектор (p1,p2) то его нормальный вектор будет (-p2;p1)
  var normalVector = {p1: -vector.p2*10, p2: vector.p1*10} 
 // console.log('Вектор нормали '+normalVector.p1+' : '+normalVector.p2);
  return normalVector;
}

function fOpredelitel(vector1,vector2){
  return vector1.p1*vector2.p2-vector1.p2*vector2.p1;
}

function fSTriangle(vector1,vector2){
  // определяет площадь произвольного треугольника
    var len1 = Math.sqrt( ( Math.pow( vector1.p1, 2) ) + ( Math.pow( vector1.p2, 2) ) );
    var len2 = Math.sqrt( ( Math.pow( vector2.p1, 2) ) + ( Math.pow( vector2.p2, 2) ) );
    var alpha = Math.acos( fSkalyr(vector1,vector2) / (len1*len2) );
    return ( ( len1 * len2 * Math.sin(alpha) ) /2 ) ;
}

function fSkalyr(vector1,vector2){
  return vector1.p1*vector2.p1+vector1.p2*vector2.p2;
}

function fIsVertex(mousePoint){
	var i, r=7;  
	for ( i=0; i<polygonA.length; i++) {
		if ((Math.abs(polygonA[i].x-mousePoint.x) < r) && (Math.abs(polygonA[i].y-mousePoint.y) < r)) {
			movingVertex = { isMoving: true, polygon: polygonA, index: i} ;
			return;
		}		
	}
	for ( i=0; i<polygonB.length; i++) {
     	if ((Math.abs(polygonB[i].x-mousePoint.x) <r) && (Math.abs(polygonB[i].y-mousePoint.y) <r)) {
    		movingVertex = { isMoving: true, polygon: polygonB, index: i} 
    		return
     	}
    } 
    movingVertex = { isMoving: false, polygon: null, index: -1}
}

function fCenterPoint(data){
  // должна высчитывать координаты серединной точки для отрезка или любого многоугольника
  var centerPoint={x:0,y:0};
  data.forEach(  function (point) {  
    centerPoint.x+=point.x; 
    centerPoint.y+=point.y;
    return centerPoint;  
  }  );
  centerPoint.x = centerPoint.x/data.length; 
  centerPoint.y = centerPoint.y/data.length; 
  //  console.log('Центральная точка '+centerPoint.x+':'+centerPoint.y);
  return centerPoint;
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//                  Обработка событий 
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  
document.onkeydown = function checkKeycode(event){   // Input для массива точек 2х многоугольников.
    var keycode;
    if(!event) var event = window.event;
    if (event.keyCode) keycode = event.keyCode; // IE
    else if(event.which) keycode = event.which; // all browsers
    // если нажата клавиша Enter, то  завершаем ввод точек
    if ((keycode==13) && (count!==-1)) { // нажат Enter и вершины 2х многоугольников еще не внесены
      if (count==0) { // завершаем ввод вершин первого многоугольника
        polygonA = polygonB.slice();
        polygonA[0].indexSvgPath = svgElem.children.length
        drawPath ( polygonA, document.querySelector('svg.base'), 'white');
        count=1;
        polygonB.length=0;
      } 
      else {  // завершаем ввод вершин второго многоугольника
      	polygonB[0].indexSvgPath = svgElem.children.length
        drawPath ( polygonB, document.querySelector('svg.base'), 'yellow'); 
        count=-1;    // флажок завершения ввода вершин всех многоугольников
        fTables();   // выводим на экран таблицы с координатами вершин обоих многоугольников 
        // добавляем мизерное значение, чтоб не мучаться с совпадением сторон и вершин многоугольников А и В
        polygonB.forEach(  function (point) { point.x+=0.000001; point.y+=0.000001;  }  ); 
        fSameDirection();
      }  
    }
    if ((keycode==46) && (event.shiftKey)) {   // если нажата клавиши shift+Delete, то очищаем картинку, таблицы и массивы точек
      fClearSVG(0, svgElem);      
      fClearSVG(0, document.getElementsByTagName('svg')[1]);      
      polygonA.length=0; // очищаем массив точек многоугольника А  
      polygonB.length=0; // очищаем массив точек многоугольника В 
      count=0;
      fTablesDelete(0);
    }
}

document.onmousemove = function(event) {
  var borderRect, indexSvgCircle;
  mousePoint= {x: event.pageX, y: event.pageY}
  // получаем расстояния до container  top, left, right, bottom
  borderRect= document.querySelector('div').getBoundingClientRect();
  // корректируем координаты, чтоб 0,0 был в углу container
  mousePoint.x -=Math.floor(borderRect.left);
  mousePoint.y -=Math.floor(borderRect.top);
  printer2.innerHTML=(mousePoint.x + ' , ' + mousePoint.y);  
  // если надо перетащить вершину многоугольника
  if (movingVertex.isMoving) {
  	indexSvgCircle = movingVertex.polygon[movingVertex.index].indexSvgCircle;
	svgElem.children[indexSvgCircle].setAttribute('cx', mousePoint.x);
	svgElem.children[indexSvgCircle].setAttribute('cy', mousePoint.y);
  }
}

document.onclick = function(event) { 
	var newPoint, indexSvg;	
  // если (еще не введены координаты обоих многоугольников) и (нажаты Shift + лев.клавиша мыши) - записываем координаты вершин многоугольников 
  if ((count!==-1) && (event.shiftKey)) {
  	indexSvg = svgElem.children.length;
  	if (polygonB.length==0) { newPoint={x: mousePoint.x, y: mousePoint.y, indexSvgCircle: indexSvg, indexSvgPath: null} } 
  		else { newPoint={x: mousePoint.x, y: mousePoint.y, indexSvgCircle: indexSvg}; } 
    polygonB.push(newPoint); 
    console.log(polygonB);
    drawCircle(document.querySelector('svg.base'), mousePoint,  5, 'orange');
  }  
  // если координаты обоих многоугольников введены и лев.клавиша мыши нажата над вершиной одного из многоугольников - тянем вершину за мышью 
  if (count==-1) 
    if (movingVertex.isMoving)  {  //если в настоящий момент какую-то точку уже перемещаем, то при повторном клике - фиксируем ее на рисунке
      movingVertex.isMoving = false;  
      if (movingVertex.polygon[0].title[0]=='A') {
      	polygonA[movingVertex.index].x =  mousePoint.x;
      	polygonA[movingVertex.index].y =  mousePoint.y;
      	var table = document.getElementsByTagName('table')[0];  // меняем значения координат одной из вершин в таблице
        table.rows[movingVertex.index].cells[1].firstElementChild.value = mousePoint.x;  
        table.rows[movingVertex.index].cells[2].firstElementChild.value = mousePoint.y;
      } else {
      		polygonB[movingVertex.index].x =  mousePoint.x + 0.000001 ;
	        polygonB[movingVertex.index].y =  mousePoint.y + 0.000001 ;
	        var table = document.getElementsByTagName('table')[1]; // меняем значения координат одной из вершин в таблице
        	table.rows[movingVertex.index].cells[1].firstElementChild.value = mousePoint.x;  
        	table.rows[movingVertex.index].cells[2].firstElementChild.value = mousePoint.y;
      }
	  fReDrawPath( svgElem.children[movingVertex.polygon[0].indexSvgPath], movingVertex.polygon);  
      fSameDirection();
      //если перемещаемых в данный момент точек нет, то проверяем: мышь над вершиной какого-либо многоугольника?
    } else fIsVertex(mousePoint);   // если Да, то movingVertex.isMoving станет true   
}

document.onchange = function(event) {    
	var indexSvgCircle;	
  // находим, в какой таблице и в какой ячейке произошло изменение
  var index = fTableToArray(document.getElementsByTagName('table')[0], polygonA);
  if (index > -1) {  // перерисовываем  многоугольник А и кружок на index-ой его вершине
    // if (!(confirm('Измененилась А'+index) )) return;
    fReDrawPath(svgElem.children[ polygonA[0].indexSvgPath ], polygonA);  
    indexSvgCircle = polygonA[index].indexSvgCircle;
    svgElem.children[indexSvgCircle].setAttribute('cx', polygonA[index].x);
    svgElem.children[indexSvgCircle].setAttribute('cy', polygonA[index].y);  
  }
  else {
    index = fTableToArray(document.getElementsByTagName('table')[1], polygonB);
    //if (!(confirm('Измененилась В'+index) )) return;
    if (index > -1) { // перерисовываем  многоугольник B и кружок на index-ой его вершине
      polygonB[index].x= Math.floor(polygonB[index].x*100)/100+0.000001;
      polygonB[index].y= Math.floor(polygonB[index].y*100)/100+0.000001;
      fReDrawPath( svgElem.children[ polygonB[0].indexSvgPath ], polygonB);
      indexSvgCircle = polygonB[index].indexSvgCircle;
      svgElem.children[indexSvgCircle].setAttribute('cx', polygonB[index].x);
      svgElem.children[indexSvgCircle].setAttribute('cy', polygonB[index].y);   
    }
  }
  fSameDirection();
}  

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Блок преобразований массивов и графов
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>  

function fGrafPrev(currentPoint, dir){
  if (currentPoint.title[0] == 'I') return currentPoint.direction[dir].prev;
    else return currentPoint.prev;
}
  
function fGrafNext(currentPoint, dir){
  if (currentPoint.title[0] == 'I') return currentPoint.direction[dir].next;
    else return currentPoint.next;
}

function fPrevVertex(vertex){         
  var dir=0;
  if (vertex.title[0] == 'B') dir=1;
  vertex=vertex.prev;
  do {
    if (vertex.title[0] == 'I') vertex=vertex.direction[dir].prev;
  } while (vertex.title[0] == 'I');
  return vertex;
}   

function fNextVertex(vertex){         
  var dir=0;
  if (vertex.title[0] == 'B') dir=1;
  vertex=vertex.next;
  do {
    if (vertex.title[0] == 'I') vertex=vertex.direction[dir].next;
  } while (vertex.title[0] == 'I');
  return vertex;
}  

function fCutTriangle(pointA, pointB, pointC){
  pointA.next=pointC;
  pointC.prev=pointA;
}
  
function fGraf(dir){
  var index, element, prevNeighbor, nextNeighbor;
  var i, j, s, filtr, filteredInters;
  var inters=intersA, polygon;
  if (dir==0) { 
    polygon=polygonA;
    inters.sort(fCompareDeltaA);
  } else {
    polygon=polygonB;
    inters.sort(fCompareDeltaB);
  }
  for (i=0; i<polygon.length; i++) {
    filtr=polygon[i].title;
    filteredInters = inters.filter( function(el) { return el.direction[dir].prev.title==filtr } );
    if (filteredInters.length>0) {
      element = filteredInters[0];
      prevNeighbor = polygon[i]; // = firstElement.direction[dir].prev; 
      prevNeighbor.next = element;
      for (j=1; j<filteredInters.length; j++) {
        element.direction[dir].next = filteredInters[j];
        filteredInters[j].direction[dir].prev = element;
        element = filteredInters[j];
      } // for (j=1; j<filteredInters.length; j++) 
      nextNeighbor = element.direction[dir].next;
      nextNeighbor.prev = element;
    } // if (filteredInters.length>0) 
  }  // for (i=0; i<polygon.length; i++) 
  //  fGrafPrint(polygon, document.getElementsByTagName('p')[dir+1]); // проверяем, что получилось -------------- 
}  // function fGraf(polygon, dir, inters, graf)

function fCompareDeltaA(a, b) {  
  return a.direction[0].delta - b.direction[0].delta;
}

function fCompareDeltaB(a, b) {  
  return a.direction[1].delta - b.direction[1].delta;
}

function fGrafPrint(graf, printer){   //////////////////////////  вспомогательная функция для тестирования
  var s = '';
  var startPoint=graf[0];
  var currentPoint = startPoint;
  var dir=0;
  if (graf[0].title[0] == 'B') dir=1;
  do {  
    s = s + currentPoint.title + ' (' +  Math.round(currentPoint.x) + ', ' + Math.round(currentPoint.y); 
    if (currentPoint.title[0] == 'I') {
        s = s +'), prevA ' + currentPoint.direction[0].prev.title +', nextA ' + currentPoint.direction[0].next.title +
                ', prevB ' + currentPoint.direction[1].prev.title +', nextB ' + currentPoint.direction[1].next.title + '<br>';
        currentPoint=currentPoint.direction[dir].next;
    } else { 
        s = s +'), prev ' + currentPoint.prev.title +', next ' + currentPoint.next.title + '<br>';
        currentPoint=currentPoint.next;
    }
  } while (!(currentPoint.title==startPoint.title));
  printer.innerHTML = s;  
} // end of function fGrafPrint(graf, printer)

function fAddPrevNext(someArray, code){
  var name='V';
  var len  =someArray.length;
  if (len<1) return;
  if (code==0) {name='A'};
  if (code==1) {name='B'};
  someArray[0].title = name+'0';
  someArray[0].prev =  someArray[len-1];
  someArray[len-1].next =  someArray[0];
  var i=0;
  while (i<len-1) {
    someArray[i].next =  someArray[i+1];
    i++;
    someArray[i].title = name+i;
    someArray[i].prev =  someArray[i-1];
  }  
 // fGrafPrint(someArray, document.getElementsByTagName('p')[code+1]);
  // alert('Проверь ссылки в вершинах многоугольника');
}

   
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Блок работы с таблицами
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 

function fTableToArray(table, polygon){  // Переносит первое отличающееся значение координат точек из ячеек таблицы table в массив polygon 
  var qRaws=polygon.length;  // неплохо было бы добавить проверку соотвествия элементов таблицы и многоугольника
  var tableValue;
  for (var i = 0; i < qRaws; i++) {
    tableValue = Math.round( table.rows[i].cells[1].firstElementChild.value *100 )/100;  // если не округлить - потом целые числа не хотят складываться с дробными!!!
    if ( Math.abs(polygon[i].x-tableValue)>0.000002 ) {
      polygon[i].x = tableValue;
      return i;
    }
    tableValue = Math.round( table.rows[i].cells[2].firstElementChild.value *100 )/100;  // если не округлить - потом целые числа не хотят складываться с дробными!!!
    if (Math.abs(polygon[i].y-tableValue)>0.000002) {
      polygon[i].y = tableValue;
      return i;
    }
  }
  return -1;  // если все координаты в таблице соответствуют вершинам многоугольника 
}

function fTables(){
  // если таблицы для координат многоугольников еще не созданы, то создаем их
  if ((document.getElementsByTagName('table').length) || (!( count== -1)) ) return;
  fCreateTable(polygonA, 'A');
  fCreateTable(polygonB, 'B');
}

function fCreateTable(polygon,name){
  var table = document.createElement('table');
  fHeadCreate('h5', 'Многоугольник '+name);
  for (var i=0; i<polygon.length; i++) {
    table.appendChild(document.createElement('tr'));
    var ob=document.createElement('td'); // в первую ячейку таблицы заносим название вершины A0,A1,A2....B0.B1.B2
    ob.innerHTML = name+i;
    table.lastElementChild.appendChild(ob);
    ftdCreate(table, polygon[i].x);
    ftdCreate(table, polygon[i].y);
  }
  document.body.appendChild(table);
}

function fCreateResultTables(){
  // по результрующему массиву RESULT строит таблицы
  var tablesQuantity = RESULT.length;
  var tableName='', s, headElement;
  if (tablesQuantity) {
    for (var i=0; i<tablesQuantity; i++) {
      fAddPrevNext(RESULT[i], 13);
      s=Math.round( fpolygonS(RESULT[i].slice(), true) *100 )/100 ;
      tableName = 'Результат '+(i+1)+' площадью '+ s+'px^2';
      fCreateResTable(RESULT[i], tableName);
    }
    resTablesCreatedFlag = true;
  }
}

function fCreateResTable(polygon,name){
  var table = document.createElement('table');
  fHeadCreate('h5', name);
  var ob=document.createElement('tr');
  var s =''
  for (var i=0; i<polygon.length; i++) {
    s = s + ' (x='+( Math.round(polygon[i].x*100)/100 )+', y='+(Math.round(polygon[i].y*100)/100 )+') > ' ;
    if ((i+1) % 2 == 0) s+='<br>';
  }
  ob.innerHTML = s ;
  table.appendChild(ob);
  document.body.appendChild(table);
}

function fHeadCreate(headlevel, headText){
      var ob=document.createElement(headlevel);
      ob.innerHTML = headText;
      document.body.appendChild(ob);
}      

function ftdCreate(table, value){
      var obTD=document.createElement('td');
      table.lastElementChild.appendChild(obTD);
      var obIN=document.createElement('input');
      obTD.appendChild(obIN);
      obIN.type="text";  
      obIN.size=2; 
      obIN.value = Math.round(value*100)/100;
}      

function fTablesDelete(upTables){ // удаляем все таблицы и их заголовки после upTables
  if (document.getElementsByTagName('table').length) {
    //if (!(confirm('Удалить таблицы?') )) return;
    for (var i=document.getElementsByTagName('table').length; i>upTables; i--)  { 
      document.body.removeChild(document.getElementsByTagName('table')[i-1]);
      document.body.removeChild(document.getElementsByTagName('h5')[i-1]);
    }      
    resTablesCreatedFlag = false;
  }  
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Блок обхода дерева DOM
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>   
/*
function fShowDOM(){
  var s = 'Список ' + fObhodDom(svgElem, s); 
  printer2.innerHTML = s;  
}

function fObhodDom(domElem, s){
    for (var i = 0; i < domElem.children.length; i++) {
        s+='  >  ' + domElem.children[i] ;
        fObhodDom(domElem.children[i]);
    } 
    return s;
}
*/
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Блок прорисовки svg
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function fClearSVG(indexOfFirstDeletingElement, svgElement){ // стирание многоугольников и кружков, обозначающих точки, с экрана (удаляем дочерние объекты svg) 
  if (svgElement.lastElementChild) {
    var m = svgElement.children.length;  
    for (var i = indexOfFirstDeletingElement; i < m; i++)  
    svgElement.removeChild(svgElement.lastElementChild); 
  }  
}  

function fSignPoligons() {  
  polygonA.forEach(  function(vertex, i) {fDrawText(svgElem, vertex, 'A'+i);}  );
  polygonB.forEach(  function(vertex, i) {fDrawText(svgElem, vertex, 'B'+i);}  );
}

function fDrawText(container, coordinaty, text) {
      var myText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      myText.setAttribute('x', coordinaty.x);
      myText.setAttribute('y', coordinaty.y);
      myText.textContent = text;
      container.appendChild(myText);
}

function fDrawLine( linePoints, container) {
  var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', linePoints[0].x);
  line.setAttribute('y1', linePoints[0].y);
  line.setAttribute('x2', linePoints[1].x);
  line.setAttribute('y2', linePoints[1].y);
  line.setAttribute('stroke', 'red');
  line.setAttribute('stroke-width', 1);
  container.appendChild(line);
}

function drawCircle(container, centerPoint, radius, fillColor) {
      var myCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      myCircle.setAttribute('cx', centerPoint.x);
      myCircle.setAttribute('cy', centerPoint.y);
      myCircle.setAttribute('r', radius);
      myCircle.style.fill = fillColor;
      container.appendChild(myCircle);
}

function fReDrawPath(path, data) { // перерисовывает имеющийся многоугольник path с новыми вершинами data
  var str = 'M' + data[0].x + ',' + data[0].y;
  str += data.slice(1).map(  function (point) {  return ' L' + point.x + ',' + point.y;  }  ).join(' ');
  str += ' z';
  path.setAttribute('d', str);
}