const SIMPLE_NAMES={
  "kadakas":"Juniperus communis","harilik kadakas":"Juniperus communis",
  "tamm":"Quercus robur","harilik tamm":"Quercus robur",
  "mänd":"Pinus sylvestris","harilik mänd":"Pinus sylvestris",
  "kuusk":"Picea abies","harilik kuusk":"Picea abies",
  "kask":"Betula pendula","arukask":"Betula pendula","sookask":"Betula pubescens",
  "vaher":"Acer platanoides","harilik vaher":"Acer platanoides",
  "pärn":"Tilia cordata","harilik pärn":"Tilia cordata",
  "pihlakas":"Sorbus aucuparia","harilik pihlakas":"Sorbus aucuparia",
  "lepp":"Alnus glutinosa","sanglepp":"Alnus glutinosa","hall lepp":"Alnus incana",
  "paju":"Salix caprea","haab":"Populus tremula","sarapuu":"Corylus avellana",
  "toomingas":"Prunus padus","õunapuu":"Malus domestica","mets-õunapuu":"Malus sylvestris",
  "pirnipuu":"Pyrus communis","kibuvits":"Rosa canina","kanarbik":"Calluna vulgaris",
  "mustikas":"Vaccinium myrtillus","pohl":"Vaccinium vitis-idaea",
  "karulauk":"Allium ursinum","künnapuu":"Ulmus laevis",
  "jugapuu":"Taxus baccata","harilik jugapuu":"Taxus baccata",
  "kuldking":"Cypripedium calceolus","kaunis kuldking":"Cypripedium calceolus",
  "palu-karukell":"Pulsatilla patens","aas-karukell":"Pulsatilla pratensis"
};

const DISPLAY={
  "Juniperus communis":"harilik kadakas","Quercus robur":"harilik tamm","Pinus sylvestris":"harilik mänd",
  "Picea abies":"harilik kuusk","Betula pendula":"arukask","Betula pubescens":"sookask",
  "Acer platanoides":"harilik vaher","Tilia cordata":"harilik pärn","Sorbus aucuparia":"harilik pihlakas",
  "Alnus glutinosa":"sanglepp","Alnus incana":"hall lepp","Salix caprea":"remmelgas","Populus tremula":"harilik haab",
  "Corylus avellana":"harilik sarapuu","Prunus padus":"harilik toomingas","Calluna vulgaris":"kanarbik",
  "Vaccinium myrtillus":"mustikas","Vaccinium vitis-idaea":"pohl","Allium ursinum":"karulauk",
  "Ulmus laevis":"künnapuu","Taxus baccata":"harilik jugapuu","Cypripedium calceolus":"kaunis kuldking",
  "Pulsatilla patens":"palu-karukell","Pulsatilla pratensis":"aas-karukell"
};

const INVASIVE=[
  "Heracleum mantegazzianum","Heracleum sosnowskyi","Impatiens glandulifera","Solidago canadensis",
  "Solidago gigantea","Reynoutria japonica","Reynoutria sachalinensis","Fallopia japonica",
  "Fallopia sachalinensis","Ambrosia artemisiifolia","Ambrosia trifida","Bidens frondosa",
  "Rhaponticum repens","Acroptilon repens"
];

const PROTECTED_I=[
  "Asplenium septentrionale","Asplenium viride","Botrychium matricariifolium","Botrychium virginianum",
  "Cystopteris sudetica","Equisetum x trachyodon","Isoetes echinospora","Polystichum aculeatum",
  "Polystichum braunii","Polystichum lonchitis","Aconitum lasiostomum","Astragalus arenarius",
  "Cerastium alpinum","Coeloglossum viride","Dactylorhiza viridis","Dactylorhiza praetermissa",
  "Dactylorhiza ruthei","Dactylorhiza sambucina","Epipogium aphyllum","Hemipilia cucullata",
  "Neottianthe cucullata","Juncus squarrosus","Laserpitium prutenicum","Ligularia sibirica",
  "Littorella uniflora","Najas flexilis","Oxytropis campestris","Peucedanum oreoselinum",
  "Pulmonaria angustifolia","Radiola linoides","Ranunculus lanuginosus","Saxifraga adscendens","Swertia perennis"
];

const PROTECTED_II=[
  "Asplenium ruta-muraria","Asplenium trichomanes","Equisetum x moorei","Equisetum scirpoides","Isoetes lacustris","Selaginella selaginoides",
  "Taxus baccata","Ajuga pyramidalis","Agrimonia pilosa","Ajuga reptans","Alisma gramineum","Allium vineale","Alyssum montanum subsp. Gmelinii",
  "Anacamptis pyramidalis","Angelica palustris","Arctium nemorosum","Arenaria procera","Artemisia maritima","Berula erecta","Bidens radiata",
  "Botrychium multifidum","Bromus benekenii","Bupleurum tenuissimum","Carex heleonastes","Carex irrigua","Carex extensa","Carex glareosa",
  "Carex ligerica","Carex mackenziei","Carex rhizina","Carex rhyncophysa","Carex disperma","Cephalanthera longifolia","Cephalanthera rubra",
  "Cerastium pumilum","Chaerophyllum temulum","Cinna latifolia","Circaea lutetiana","Cochlearia danica","Corallorhiza trifida","Corydalis intermedia",
  "Crepis mollis","Cruciata glabra","Cyperus fuscus","Cypripedium calceolus","Dactylorhiza cruenta","Dactylorhiza osiliensis","Dactylorhiza russowii",
  "Dianthus arenarius","Dianthus superbus","Dracocephalum ruyschiana","Elatine hydropiper","Elytrigia junceiformis","Eriophorum gracile","Eryngium maritimum",
  "Festuca altissima","Gentiana pneumonanthe","Geranium columbinum","Geranium lucidum","Gladiolus imbricatus","Glyceria lithuanica","Gymnadenia odoratissima",
  "Halimione pedunculata","Hedera helix","Helichrysum arenarium","Herminium monorchis","Holcus mollis","Hydrocotyle vulgaris","Hypericum montanum",
  "Jovibarba sobolifera","Juncus stygius","Juncus subnodulosus","Koeleria gracilis","Lathyrus niger","Leersia oryzoides","Liparis loeselii",
  "Listera cordata","Neottia cordata","Lobelia dortmanna","Lycopodiella inundata","Malaxis monophyllos","Malaxis paludosa","Hammarbya paludosa",
  "Moehringia lateriflora","Mulgedium sibiricum","Myriophyllum alterniflorum","Najas marina subsp. intermedia","Onobrychis arenaria","Ophrys insectifera",
  "Orchis mascula","Androrchis mascula","Orchis morio","Anacamptis morio","Orchis ustulata","Neotinea ustulata","Oxytropis pilosa","Pedicularis sceptrum-carolinum",
  "Pinguicula alpina","Pleurospermum austriacum","Poa alpina","Polygonum oxyspermum","Potamogeton trichoides","Prunus spinosa","Pulsatilla patens",
  "Ranunculus nemorosus","Rhinanthus osiliensis","Rhynchospora fusca","Rubus arcticus","Sagina maritima","Salix repens","Samolus valerandi",
  "Saussurea alpina subsp. Esthonica","Saussurea alpina subsp. esthonica","Saxifraga hirculus","Schoenus nigricans","Scirpus radicans","Silene chlorantha",
  "Sisymbrium supinum","Sorbus rupicola","Sparganium angustifolium","Sparganium gramineum","Spergularia media","Suaeda maritima","Thesium ebracteatum",
  "Trifolium campestre","Trisetum sibiricum","Veronica dillenii","Vicia lathyroides","Vicia tenuifolia","Viola elatior","Viola pumila","Viola selkirkii"
];

const PROTECTED_III=[
  ["mets-vareskold",["Diphasium complanatum","Diphasiastrum complanatum"]],
  ["nõmm-vareskold",["Diphasium tristachyum","Diphasiastrum tristachyum"]],
  ["harilik ungrukold",["Huperzia selago"]],["paas-kolmissõnajalg",["Gymnocarpium robertianum"]],["karukold",["Lycopodium clavatum"]],
  ["karulauk",["Allium ursinum"]],["veripunane koldrohi",["Anthyllis coccinea"]],["roosa merikann",["Armeria maritima subsp. elongata"]],
  ["sile kardhein",["Ceratophyllum submersum"]],["rootsi kukits",["Cornus suecica"]],["lääne-mõõkrohi",["Cladium mariscus"]],
  ["harilik sügislill",["Colchicum autumnale"]],["must tuhkpuu",["Cotoneaster niger"]],["karvane ristmadar",["Cruciata laevipes"]],
  ["balti sõrmkäpp",["Dactylorhiza baltica"]],["vööthuul-sõrmkäpp",["Dactylorhiza fuchsii"]],["kahkjaspunane sõrmkäpp",["Dactylorhiza incarnata"]],
  ["kuradi-sõrmkäpp",["Dactylorhiza maculata"]],["müürkevadik",["Draba muralis"]],["metskevadik",["Draba nemoralis"]],
  ["tumepunane neiuvaip",["Epipactis atrorubens"]],["laialehine neiuvaip",["Epipactis helleborine"]],["soo-neiuvaip",["Epipactis palustris"]],
  ["harilik kikkapuu",["Euonymus europaea","Euonymus europaeus"]],["roomav öövilge",["Goodyera repens"]],["harilik käoraamat",["Gymnadenia conopsea"]],
  ["kaljukress",["Hornungia petraea"]],["siberi võhumõõk",["Iris sibirica"]],["rand-seahernes",["Lathyrus japonicus"]],
  ["suur käopõll",["Listera ovata","Neottia ovata"]],["mets-kuukress",["Lunaria rediviva"]],["mets-õunapuu",["Malus sylvestris"]],
  ["harilik porss",["Myrica gale"]],["pruunikas pesajuur",["Neottia nidus-avis"]],["väike vesikupp",["Nuphar pumila"]],
  ["valge vesiroos",["Nymphaea alba"]],["väike vesiroos",["Nymphaea candida"]],["hall käpp",["Orchis militaris"]],
  ["põdrajuure-soomukas",["Orobanche bartlingii"]],["suur soomukas",["Orobanche elatior"]],["ohakasoomukas",["Orobanche pallidiflora"]],
  ["tähkjas rapuntsel",["Phyteuma spicata"]],["kahelehine käokeel",["Platanthera bifolia"]],["rohekas käokeel",["Platanthera chlorantha"]],
  ["niitjas penikeel",["Potamogeton filiformis"]],["väike penikeel",["Potamogeton pusillus"]],["põõsasmaran",["Potentilla fruticosa","Dasiphora fruticosa"]],
  ["aas-karukell",["Pulsatilla pratensis"]],["mets-pirnipuu",["Pyrus pyraster"]],["tui-tähtpea",["Scabiosa columbaria"]],
  ["värvi-paskhein",["Serratula tinctoria"]],["niidu-asparhernes",["Tetragonolobus maritimus","Lotus maritimus"]],
  ["ahtalehine ängelhein",["Thalictrum lucidum"]],["alpi ristik",["Trifolium alpestre"]],["künnapuu",["Ulmus laevis"]],
  ["püstine hiirehernes",["Vicia cassubica"]],["lood-angervars",["Vincetoxicum hirundinaria"]],["lodukannike",["Viola uliginosa"]]
];
