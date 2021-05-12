export default
{
  "materials": [
    {
      "name": "Kinhasa Quinted 14",
      "color": "rgb(255, 255, 255)",
      "texture": "textures/Kinshasa Quinted_14_base.png",
      "normal": "textures/Kinshasa Quinted_normal.png",
      "aor": "textures/Kinshasa Quinted_ao_roughness.png",
      "roughness": 0.45
    },
    {
      "name": "Mattress",
      "color": "rgb(255, 255, 255)",
      "texture": "textures/Fabric_Mattress_base.png",
      "normal": "textures/Fabric_Mattress_normal.png",
      "roughness": 0.7
    },
    {
      "name": "Mattress Edge",
      "color": "rgb(255, 255, 255)",
      "texture": "textures/Fabric_Topper_Edge_base.png",
      "normal": "textures/Fabric_Topper_Edge_normal.png",
      "roughness": 0.65
    },
    {
      "name": "Wood",
      "color": "rgb(255, 255, 255)",
      "texture": "textures/wood_base.png",
      "roughness": 0.55
    },
    {
      "name": "Metal",
      "color": "rgb(187, 187, 187)",
      "texture": "textures/wood_base.png",
      "roughness": 0.1,
      "metalness": 1
    },
    {
      "name": "Back",
      "color": "rgb(255, 255, 255)",
      "texture": "textures/Back_base.png",
      "normal": "textures/Back_normal.png",
      "roughness": 0.7
    }
  ],

  "model": {
    "url" : "models/bed.gltf",
    "mappings": [
      {
        "mesh": "Fabric",
        "material": "Kinhasa Quinted 14"
      },
      {
        "mesh": "Fabric_Mettress",
        "material": "Mattress"
      },
      {
        "mesh": "Back",
        "material": "Back"
      },
      {
        "mesh": "Fabric_Mattress_Edge",
        "material": "Mattress Edge"
      },
      {
        "mesh": "Metal",
        "material": "Metal"
      },
      {
        "mesh": "Logo",
        "material": "Metal"
      },
      {
        "mesh": "Legs_Wood",
        "material": "Wood"
      }
    ]
  }
}
