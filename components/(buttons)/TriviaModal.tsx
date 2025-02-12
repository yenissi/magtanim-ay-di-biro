import React,{ useEffect,useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Audio } from 'expo-av';

interface TriviaModalProps {
  visible: boolean;
  onClose: () => void;
}

const TriviaModal = ({ visible, onClose }: TriviaModalProps ) => {
  const [buttonSound, setButtonSound] = useState<Audio.Sound | null>(null);
  // Load Sound Effect
  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sound/sound.mp3')
        );
        soundInstance = sound;
        setButtonSound(sound);
      } catch (error) {
        console.error("Failed to load sound:", error);
      }
    };

    loadSound();

    return () => {
      if (soundInstance) {
        soundInstance.unloadAsync();
      }
    };
  }, []);

  // Play Sound Effect
  const playSound = async () => {
    if (!buttonSound) {
      console.warn("Sound not loaded yet!");
      return;
    }
    try {
      await buttonSound.replayAsync();
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 rounded-lg m-8 w-10/12 max-h-[85%]">
          <Pressable className="p-2 flex-row items-center justify-center border border-b rounded-t-lg" 
          onPress={async () => {
            await playSound();
            onClose();
          }}
          >
            <Text className="text-lg font-bold text-center pt-4">Trivia</Text>
            <AntDesign name="close" size={20} color="black" className="p-2 absolute right-3 top-3" />
          </Pressable>

          <ScrollView className="px-4 border border-b rounded-b-lg p-4">
            {/* Trivia Item 1 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/land.jpg")} style={{ width: 90, height: 90, borderRadius: 3 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Nakapipigil sa Pagguho ng Lupa at Baha</Text>
                <Text className="text-sm text-justify w-[450px]">
                  Kumakapit ang mga ugat ng mga punong orna-mental sa lupang taniman kaya nakakaiwas sa landslide o pagguho ng lupa. Ang mga punong ornamental ay nakatutulong din sa pagingat sa pagbaha dahil sa tulong ng mga ugat nito.
                </Text>
              </View>
            </View>

            {/* Trivia Item 2 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/pollutions.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Naiiwasan ang Polusyon</Text>
                <Text className="text-sm text-justify w-[450px]">
                  Ang pagtatanim ng mga halamang ornamental ay nakakatulong sa pagsasala ng maruruming hangin sanhi ng usok ng tambutso, 
                  pagsusunog at napapalitan ng malinis na oksiheno (oxygen) na siya nating nilalanghap.
                </Text>
              </View>
            </View>

             {/* Trivia Item 3 */}
             <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/lilim.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              {/* <Text>https://ph.pinterest.com/pin/747456869388157381/</Text> */}
              <View className="p-3">
                <Text className="text-base font-bold">Nagbibigay ng lilim</Text>
                <Text className="text-sm text-justify w-[450px]">
                May mga matataas at mayayabong na halamang ornamental gaya ng kalachuchi, pine tree,
                at marami pang iba na maaaring itanim upang masilungan ng tao . 
                </Text>
              </View>
            </View>

            {/* Trivia Item 4 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/kitaan.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Napagkakakitaan</Text>
                {/* https://bernadinemanansala.weebly.com/spot-news/guiguinto-garden-capital-of-the-philippines */}
                <Text className="text-sm text-justify w-[450px]">
                Maaaring maibenta ang mga halamang ornamental na hindi naitanim o magpunla o magtanim sa paso sa mga itim na plastik bag o lata ng mga halamang ornamental na puwedeng ibenta.
                </Text>
              </View>
            </View>
            
            {/* Trivia Item 5 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/kita.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Nakakapagpaganda ng Kapaligiran</Text>
                {/* https://www.desktopbackground.org/wallpaper/hd-nature-wallpapers-free-habitat-images-download-hd-images-798221 */}
                <Text className="text-sm text-justify w-[450px]">
                Sa pamamagitan ng pagtatanim ng mga halamang ornamental sa paligid ng tahanan, parke at iba pang lugar, 
                ito ay nakatatawag ng pansin sa mga dumadaan na tao lalo na kung ang mga ito ay namumulaklak at ma-halimuyak.
                </Text>
              </View>
            </View>
            {/* Additional */}
            <View>
              {/* Add more trivia items here */}
              <Text className="text-lg font-medium text-center">Pagpili ng Itatanim na Halamang Ornamental</Text>
              <Text className="text-[12px] text-justify">Ang mga halamang ornamental ay may iba’t ibang katangian. 
                May mga halaman/punong ornamental na mataas ,may mababa, may namumulaklak at di-namumulaklak, 
                may madaling palaguin, may mahirap palaguin, may nabubuhay sa lupa at may nabubuhay sa tubig. 
                Kaya mahalagang piliin ang itatanim na halamang ornamental na angkop sa lugar na pagtataniman.
                Mga bagay na Dapat Isaalang-alang sa Pagtatanim ng Halamang Ornamental:
              </Text>
              <Text className="text-[12px] ">1. Kalagayan ng Lugar</Text>
              <Text className="text-[12px] ">2. Sibli ng halaman sa Kapaligiran</Text>
              <Text className="text-[12px] ">3. Kaangkupan sa Panahonr</Text>
              <Text className="text-[12px] ">4. Kalagayan ng Lupang Taniman</Text>
              <Text className="text-lg font-medium text-center mt-4">Mga paalala sa magsasagawa ng pagtatanim ng mga halaman/punong ornamental sa bakuran o tahanan:</Text>
              <Text className="text-[12px]">1. Ang mga punong ornamental na matataas ay itinatanim sa gilid, sa kanto, o sa gitna ng ibang mababang halaman.</Text>
              <Text className="text-[12px]">2. Ang mga halamang ornamental na mababa ay itinatanim sa mga panabi o paligid ng tahanan, maaari sa bakod, sa gilid o daanan o pathway.</Text>
              <Text className="text-[12px]">3. Ang mga namumulaklak na halaman/punong ornamental ay inihahalo o isinasama sa mga halamang di namumulaklak.</Text>
              <Text className="text-[12px]">4. Ang mga halaman/punong ornamental na madaling palaguin ay maaring itanim kahit saan ngunit ang mahirap palaguin ay itinatanim sa lugar na maalagaan itong mabuti.</Text>
              <Text className="text-[12px]">5. Ang mga halamang ornamental na lumalago sa lupa ay maaaring itanim sa tamang makakasama nito at ang mga halamang lumalago sa tubig ay maari sa babasaging sisidlan sa loob ng tahanan oa fish pond sa halamanan.</Text>
              {/* Add more trivia items here */}
              <Text className="text-lg font-medium text-center mt-4">IBA’T IBANG KASANGKAPANG GINAGAMIT SA PAGHAHALAMAN</Text>
              <Text className="text-[12px]">Asarol - Ito ay ginagamit sa pagbubungkal ng lupa upang ito ay mabuhaghag.</Text>
              <Text className="text-[12px]">Kalaykay - Ginagamit ito sa paglilinis ng bakuran. Tinitipon nito ang mga kalat sa halaman tulad ng mg dahong tuyo, tuyong damo, at iba pang kalat. 
                Maaari din itong gamitin sa pag-aalis ng malalaki at matitigas na tipak ng lupa at bato sa taniman.</Text>
              <Text className="text-[12px]">Piko - Ito ay ginagamit upang durugin at pinuhin ang mga malalaking tipak na bato.</Text>
              <Text className="text-[12px]">Dulos - Ito ay ginagamit sa pagbubungkal ng lupa sa paligid ng halaman. Mahusay rin itong gamitin sa paglilipat ng mga punla.</Text>
              <Text className="text-[12px]">Regadera - Ginagamit ito sa pagdidilig. Ito’y may mahabang lagusan ng tubig na may maliit na butas sa dulo</Text>
              <Text className="text-[12px]">Pala - Ito’y ginagamit sa paglilipat ng lupa. Ginagamit din ito sa paghuhukay ng butas o kanal sa lupa at pagsasaayos ng lupa sa tamang taniman</Text>
              <Text className="text-[12px]">Itak - Pamutol sa mga sanga at puno ng malalaking halaman</Text>
              <Text className="text-[12px]">Tulos at Pi-si - Ang mga ito ay ginagamit na gabay sa paggawa ng mga hanay sa tamang taniman sa pagbubungkal ng lupa. Tinutusok ang may tulos sa apat na sulok ng lupa at tinalian ng pisi upang sundin bilang gabay</Text>

              <Text className="text-lg font-medium mt-4 text-center">Masistemang pangangalaga sa tanim sa pagdidilig ng halaman</Text>
              <Text className="text-[12px]">a. Diligan ang mga halaman araw-araw sa hapon o sa umagang-umaga</Text>
              <Text className="text-[12px]">b. Ingatan ang pagdidilig para hindi masira ang mga tanim na halaman</Text>
              <Text className="text-[12px]">c. Iwasang malunod ang mga halaman, lalo na yaong mga bagong lipat na punla</Text>
              <Text className="text-[12px]">d. Iwasan ang malakas na pagbuhos ng tubig</Text>
              <Text className="text-[12px]">e. Kung ang gamit mo ay regadera, kailangan iyong maliit lamang ang butas at upang manatiling mamasa-masa ang lupa, dilgan din ang lupang nakapaligid sa mga tanim.</Text>
              
              <Text className="text-lg font-medium text-center mt-4">Kahalagahan ng Paglalagay ng Abono</Text>
              <Text className="text-[12px] text-justify">Ang abono o pataba ay mahalaga sa mga pananim. Pinagyayaman nito ang lupa upang maging sapat ang sustansyag taglay ng lupa na kailangan ng mga ugat ng pananim. Bagamat may mga di-organikong pataba ay higit na iminungkahi dahil ligtas at mura.
              Ngunit hindi lamang basta maglalagay ng abono ang kailangan upang lumaki ng malusog ang mga halaman. Kailangan din ang wastong kaalaman sa pagpili ng pataba at ang paggamit nito.
              Ang patabang galling sa mga bagay na buhay ay inihahalo sa lupa. Ang paraan ng paglalagay ng patabang galling sa mga bagay na walang buhay ay nakasulat sa pakete ng pataba.
              </Text>

              <Text className="text-lg font-medium text-center mt-4">Paggawa ng Organikong Pataba (Compost Pit)</Text>
              <Text className="text-[12px]">1. Pumili ng angkop na lugar</Text>
              <Text className="text-[12px]">a. Patag at tuyo ang lupa</Text>
              <Text className="text-[12px]">b. May kalayuan sa bahay</Text>
              <Text className="text-[12px]">c. Malayo sa tubig tulad ng ilog, sapa at iba pa.</Text>
              <Text className="text-[12px] text-justify">2. Gumawa ng hukay sa lupa nang may limang metro ang lalim at dalawang metro ang lapad. Patagin ang loob ng hukay at hayaang makabilad sa araw upang hindi mabuhay ang anumang uri ng mikrobyo.</Text>
              <Text className="text-[12px] text-justify">3. Tipunin ang mga nabubulok na kalat gaya ng tuyong damo, dahon mga balat ng prutas at iba pa. Ilatag ito nang pantay sa ilalim ng hukay hanggang umabot ng 30 sentimetro ang taas. Haluan ng 1 hang-gang 2 kilo ng abono urea ang inilagay na basura sa hukay.</Text>
              <Text className="text-[12px] text-justify">4. Patungan ito ng mga dumi ng hayop hanggang uma-bot ng 15 sentimetro ang kapal at lagyan muli ng lu-pa, abo o apog. Gawain ito ng paulit-ulit hanggang mapuno ang hukay.
              . Panatilihing mamasa-masa ang hukay sa pamamagitan ng pagdilig araw-araw. Tiyakin hindi ito babahain kung panahon nanamn ng tagulan, makabubuting takpan ang ibabaw ng hukay ng ilang piraso ng dahon ng saging upang hindi bahain.
              </Text>
              <Text className="text-[12px] text-justify">5. Pumili ng ilang piraso ng kawayang wala nang buko at may butas sa gilid. Itusok ito sa nagawang compost pit upang makapasok ang hangin at maging mabilis ang pagkabulok ng mga basura.</Text>
              <Text className="text-[12px] text-justify">6. Bunutin ang mga itinusok na kawayan pagkalipas ng tatlong linggo. Haluing mabuti ang mga pinagsama-samang kalat at lupa. Pagkalipas ng dalawang buwang o higit pa ay maaari na itong gamiting pataba ayon sa mabilis na pagkakabulok ng mga basurang ginamit.</Text>

              <Text className="text-lg font-medium text-center mt-4">Wastong Pag-aani at Pagsasapamilihan ng Halamang Ornamental</Text>
              <Text className="text-[12px] text-justify">Ang pagsasapamilihan ng mga halamang ornamental ay isang gawaing dapat mong malaman bilang isang mag-aaral.
              Mahalagang malaman ang mga tamang paraan ng pag-aani at pag sasapamilihan sa mga ito. Dapat ding alamin ang mga halamang madaling maipagbili.
              Ang halamang ornamental lalo na yung mga namumulaklak ay maaring ipagbili kung ang mga ito ay may bulakalak na. Maaaring mabili ang mga halamang may bulaklak sapagkat ito ay mapang-akit sa mga mata ng mga tao.
              </Text>
              <Text className="text-[12px]">a. Ang halaga o presyo ng mga halamang ornamental ay ibinabatay sa kanilang laki, uri, at haba ng pag-aalaga.</Text>
              <Text className="text-[12px]">b. Ipinagbibili ang halamang ornamental nang nakapaso o nakaplastik at minsan sanga o tangkay.</Text>
              <Text className="text-[12px]">c. Mahalaga ang kaalaman sa pagtutuos upang malaman kung kumikita o nalulugi ang paghahalaman.</Text>
              <Text className="text-[12px] text-justify mb-4">Sa mga nag-aalaga ng halamang ornamental na namumulaklak at di namumulaklak, may mga palatandaan na tinitingnan kung ito ay dapat ng ipagbili. Kadalasan, ang mga ito ay matataas, malalago at magaganda ang mga dahon. Ang tamang pagkuha ng mga bulaklak ay kung ito ay malapit ng bumuka at bumukadkad. Tinatanggal ang ibang dahon at tinatali sa isang malilim na lugar. Ang paglalagay sa timba na may tubig ay nagpapatagal sa kanilang kasariwaan.</Text>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default TriviaModal;
