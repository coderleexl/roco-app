package {
 import flash.display.Sprite; import flash.display.Loader; import flash.display.Bitmap;
 import flash.events.Event; import flash.utils.ByteArray; import flash.utils.setTimeout;
 import flash.external.ExternalInterface;
 public class ImageProbe extends Sprite {
  private var l:Loader=new Loader(); private var b:ByteArray=new ByteArray();
  private var phase:int=0; private var count:int=0; private var failed:Boolean=false;
  private var red:Array=[137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,60,0,0,0,60,8,6,0,0,0,58,252,217,114,0,0,0,93,73,68,65,84,120,156,237,207,177,13,0,48,8,192,48,254,127,154,158,81,41,120,200,30,207,206,236,165,230,247,0,48,48,48,48,48,48,240,157,128,235,1,215,3,174,7,92,15,184,30,112,61,224,122,192,245,128,235,1,215,3,174,7,92,15,184,30,112,61,224,122,192,245,128,235,1,215,3,174,7,92,15,184,30,112,61,224,122,192,245,128,235,61,7,152,5,133,175,243,55,153,0,0,0,0,73,69,78,68,174,66,96,130]; private var blue:Array=[137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,60,0,0,0,60,8,6,0,0,0,58,252,217,114,0,0,0,97,73,68,65,84,120,156,237,207,161,1,0,48,12,195,176,252,255,116,247,194,88,64,4,204,173,36,119,91,213,7,128,129,129,129,129,129,129,119,170,15,0,3,3,3,3,3,3,239,84,31,0,6,6,6,6,6,6,222,169,62,0,12,12,12,12,12,12,188,83,125,0,24,24,24,24,24,24,120,167,250,0,48,48,48,48,48,48,240,78,245,1,96,96,96,224,255,30,2,20,5,133,128,83,123,222,0,0,0,0,73,69,78,68,174,66,96,130];
  public function ImageProbe() {
   l.contentLoaderInfo.addEventListener(Event.COMPLETE,done);
   load(red);
  }
  private function load(a:Array):void { b.length=0; for each(var v:int in a)b.writeByte(v); b.position=0; l.loadBytes(b); }
  private function done(e:Event):void {
   var image:Bitmap=l.content as Bitmap;
   var px:uint=image==null?0:image.bitmapData.getPixel32(1,1); ExternalInterface.call("imageProbeStep",phase,px==0xffff0000?1:px==0xff0000ff?2:0);
   var expected:uint=phase==0?0xffff0000:0xff0000ff;
   if(image==null||image.bitmapData==null||image.bitmapData.getPixel32(1,1)!=expected)failed=true;
   if(image!=null&&image.bitmapData!=null){var copy:Bitmap=new Bitmap(image.bitmapData);copy.x=phase*70;addChild(copy);}
   if(phase==0){phase=1;l.unload();load(blue);return;}
   if(phase==1){phase=2;l.unload();load(red);l.unload();load(blue);return;}
   count++;setTimeout(finish,400);
  }
  private function finish():void { ExternalInterface.call("imageProbeResult",failed?0:1,count); }
 }
}